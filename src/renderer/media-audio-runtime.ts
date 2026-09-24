interface AudioGraph {
  source: MediaElementAudioSourceNode;
  input: GainNode;
  split: ChannelSplitterNode;
  left: GainNode;
  right: GainNode;
  merge: ChannelMergerNode;
  channel: string | null;
}

export interface MediaAudioRuntime {
  start(): void;
  configure(
    element: HTMLMediaElement,
    channel: string,
    gain: number,
    pan: number,
  ): boolean;
  release(element: HTMLMediaElement): void;
  close(): Promise<void>;
}

function createGraph(
  context: AudioContext,
  element: HTMLMediaElement,
): AudioGraph {
  const source = context.createMediaElementSource(element);
  const input = context.createGain();
  const split = context.createChannelSplitter(2);
  const merge = context.createChannelMerger(2);
  const left = context.createGain();
  const right = context.createGain();
  input.channelCount = 2;
  input.channelCountMode = 'explicit';
  source.connect(input);
  input.connect(split);
  left.connect(merge, 0, 0);
  right.connect(merge, 0, 1);
  merge.connect(context.destination);
  return { source, input, split, left, right, merge, channel: null };
}

function disconnect(graph: AudioGraph): void {
  graph.source.disconnect();
  graph.input.disconnect();
  graph.split.disconnect();
  graph.left.disconnect();
  graph.right.disconnect();
  graph.merge.disconnect();
}

export function createMediaAudioRuntime(): MediaAudioRuntime {
  const graphs = new Map<HTMLMediaElement, AudioGraph>();
  let context: AudioContext | null = null;

  function start(): void {
    context ??= typeof AudioContext === 'function' ? new AudioContext() : null;
    context?.resume().catch(() => {});
  }

  function configure(
    element: HTMLMediaElement,
    channel: string,
    gain: number,
    pan: number,
  ): boolean {
    if (!context) return false;
    let graph = graphs.get(element);
    if (!graph) {
      graph = createGraph(context, element);
      graphs.set(element, graph);
    }
    if (graph.channel !== channel) {
      graph.split.disconnect();
      graph.split.connect(graph.left, channel === 'right' ? 1 : 0);
      graph.split.connect(graph.right, channel === 'left' ? 0 : 1);
      graph.channel = channel;
    }
    const normalizedPan = Math.max(-1, Math.min(1, pan));
    graph.left.gain.value = gain * (normalizedPan > 0 ? 1 - normalizedPan : 1);
    graph.right.gain.value = gain * (normalizedPan < 0 ? 1 + normalizedPan : 1);
    return true;
  }

  function release(element: HTMLMediaElement): void {
    const graph = graphs.get(element);
    if (!graph) return;
    disconnect(graph);
    graphs.delete(element);
  }

  async function close(): Promise<void> {
    for (const graph of graphs.values()) disconnect(graph);
    graphs.clear();
    const activeContext = context;
    context = null;
    if (activeContext && activeContext.state !== 'closed') {
      await activeContext.close();
    }
  }

  return { start, configure, release, close };
}
