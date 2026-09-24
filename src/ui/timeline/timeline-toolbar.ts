export interface TimelineToolbar {tools:HTMLDivElement;beatButton:HTMLButtonElement;rangeStatus:HTMLOutputElement}

const required=<T extends HTMLElement>(container:HTMLElement,selector:string):T=>{const element=container.querySelector<T>(selector);if(!element)throw new Error(`Controle da timeline ausente: ${selector}`);return element};

export function getTimelineToolbar(container:HTMLElement):TimelineToolbar {
  return {
    tools:required<HTMLDivElement>(container,'.timeline-edit-tools'),
    beatButton:required<HTMLButtonElement>(container,'[data-tool="beats"]'),
    rangeStatus:required<HTMLOutputElement>(container,'.render-range-status'),
  };
}
