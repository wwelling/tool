if (!!window.EventSource) {
  const eventSource = new EventSource('/event');

  const decoder = new TextDecoder('utf-8');

  const dataElem = document.getElementById('data');

  eventSource.addEventListener('event', function (message) {
    const data = decoder.decode(Int8Array.from((JSON.parse(message.data).data)));
    console.log(data);
    dataElem.value += data;
    dataElem.scrollTop = dataElem.scrollHeight;
  });

  document.getElementById('form').onsubmit = function (e) {
    const args = e.target.command.value.split(' ');
    const command = args.shift();

    fetch('http://localhost:8080/run', {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      method: 'POST',
      body: JSON.stringify({
        event: 'event',
        command: command,
        args: args
      })
    });

    e.target.command.value = '';
    e.target.data.value = '';
    e.preventDefault();
  };

} else {
  console.error("Browser doesn't support EventSource")
}
