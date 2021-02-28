let init = false;

const connection = new EventSource('event');

const parser = new DOMParser();

const renderGlyph = (item, data) => {
  const glyph = parser.parseFromString(data, 'application/xml');
  const glyphElem = item.ownerDocument.importNode(glyph.documentElement, true);
  if (item.firstChild) {
    item.replaceChild(glyphElem, item.firstChild);
  } else {
    item.appendChild(glyphElem);
  }
}

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

        if (config.data[item.id]) {
          renderGlyph(item, config.data[item.id].glyph);
        }

        connection.addEventListener(item.id, (itemEvent) => {
          renderGlyph(item, JSON.parse(itemEvent.data).glyph);
        });

        grid.appendChild(item);
      }
    }
  }
});
