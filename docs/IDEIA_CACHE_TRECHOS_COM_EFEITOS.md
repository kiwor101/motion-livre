# Ideia futura: cache de trechos com efeitos

Registro de 2026-09-15. Um usuário observou que, ao aplicar motion blur no CapCut, encontra na pasta do projeto um arquivo correspondente ao trecho processado do clipe. Esse arquivo pode ser copiado e reproduzido como um vídeo já exportado. Trata-se de uma observação do usuário, não de uma confirmação sobre o formato interno ou a estratégia geral de renderização do CapCut.

Hipótese para o Motion Livre: efeitos que exigem processamento por frame poderiam gerar um vídeo intermediário para o trecho afetado. O preview e a exportação final reutilizariam esse trecho enquanto mídia, desde que o clipe, o efeito e os parâmetros não mudassem. Isso poderia evitar recalcular o mesmo motion blur em cada reprodução ou exportação.

Antes de implementar, medir o custo de gerar e armazenar esses trechos contra o ganho na reprodução e na exportação. Um protótipo deve preservar a qualidade e a sincronia de áudio, invalidar o cache ao mudar cortes, velocidade, fonte, efeito ou parâmetros, e limpar arquivos intermediários sem afetar mídias do usuário. O plano atual de exportação já separa segmentos que podem passar diretamente pelo FFmpeg dos que precisam de composição; esse é um possível ponto de integração para o estudo.
