let init = false;

const connection = new EventSource('event');

const parser = new DOMParser();

connection.addEventListener('init', (initEvent) => {
  if (!init) {
    init = true;

    const config = JSON.parse(initEvent.data);

    console.log(config);

    const grid = document.getElementById('grid');

    grid.style.height = `${config.rows * config.size}px`;
    grid.style.width = `${config.columns * config.size}px`;

    grid.style.gridTemplateColumns = `repeat(${config.columns}, ${config.size}px)`;

    for (let x = 0; x < config.columns; ++x) {
      for (let y = 0; y < config.rows; ++y) {
        const item = document.createElement("div");
        item.id = `${x},${y}`;
        item.style.height = `${config.size}px`;
        item.style.width = `${config.size}px`;
        item.classList.add('item');

        connection.addEventListener(item.id, (itemEvent) => {
          const data = itemEvent.data.substring(1, itemEvent.data.length - 1).replace(/\\"/g, '"');
          const glyph = parser.parseFromString(data, 'application/xml');
          const glyphElem = item.ownerDocument.importNode(glyph.documentElement, true);
          if (item.firstChild) {
            item.replaceChild(glyphElem, item.firstChild);
          } else {
            item.appendChild(glyphElem);
          }
        });

        grid.appendChild(item);
      }
    }
  }
});
