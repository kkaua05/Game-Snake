📖 Visão Geral

O Game Snake é uma reinterpretação moderna do clássico jogo Snake, desenvolvida com foco em performance, clean code e fundamentos sólidos de Desenvolvimento Web. Diferente de muitas implementações que dependem de bibliotecas externas, este projeto foi construído inteiramente com JavaScript Vanilla, demonstrando domínio nativo da linguagem e das APIs do navegador.
O objetivo principal foi criar uma experiência de jogo fluida e visualmente atraente, enquanto se aplicavam boas práticas de engenharia de software, como separação de responsabilidades (MVC simplificado) e persistência de dados no lado do cliente.

⚙️ Como Funciona (Lógica Interna)

O jogo opera baseando-se em um Game Loop controlado, que gerencia o estado da aplicação em tempo real. O funcionamento pode ser dividido em quatro pilares:
Renderização (Canvas API):

O jogo utiliza o elemento <canvas> do HTML5 como uma grade bidimensional.

A função draw() limpa a tela e redesenha todos os elementos (cobra, comida, pontuação) a cada frame, criando a ilusão de movimento.
O sistema de coordenadas é baseado em uma grade (grid), onde cada célula possui 20x20 pixels.
Game Loop (Intervalo de Tempo):

Utilizamos setInterval para executar a função update() a cada 100 milissegundos.

Isso controla a velocidade do jogo (FPS) e garante que a lógica não dependa da taxa de atualização do monitor do usuário.
Gerenciamento de Estado:

A cobra é um array de objetos, onde cada objeto representa um segmento do corpo {x, y}.

O movimento é simulado adicionando uma nova cabeça na direção atual (unshift) e removendo a cauda (pop), a menos que a cobra tenha comido.
Variáveis globais controlam o score, status do jogo e direção atual (dx, dy).

Detecção de Colisão:

A cada frame, o jogo verifica se as coordenadas da cabeça da cobra coincidem com:
Paredes: Coordenadas menores que 0 ou maiores que o limite do canvas.
Próprio Corpo: Iteração sobre o array da cobra para verificar sobreposição.
Comida: Gera nova posição aleatória e incrementa o score.
Persistência de Dados:
O High Score é salvo no LocalStorage do navegador. Isso permite que o recorde do usuário seja mantido mesmo após fechar a aba ou reiniciar o computador.
