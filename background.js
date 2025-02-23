chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData") {
    fetch(message.url, {
      method: "GET",
      headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json"
      }
    })
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Needed to make sendResponse async
  }
  if (message.action === "fetchPage") {
    fetch(message.url)
      .then(response => response.text())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Needed to make sendResponse async
  }
  if (message.action === "bnwStartWS") {
    console.log("opening socket")
    let socket = new WebSocket("wss://eu1-layer.doofinder.com/layer/1/websocket?hashid=015321b222976d938d2a98273aa700ac&origin=www.bnw-distribution.com&zone=eu1&installation_id=bb62a328-4334-469f-9bbd-12b6bbfce81a&language=en&currency=EUR&session_id=83fc7b66bd8040df9b91d78ad2146f6c&session_alive=true&user_id=92674b47-9d84-4940-91bb-8a8d650b1990");

    socket.onopen = () => {
      console.log("socket opened")
      socket.send('["5","27","lv:df-xw0hn34b91o99oearcq8xqrcl6qdn1sw","event",{"type":"hook","event":"search-suggest","value":{"search":{"query":"' + message.searchTerm + '"}}}]');
    };

    socket.onmessage = (event) => {
        let data = JSON.parse(event.data);
        sendResponse({ success: true, data });
    };

    socket.onerror = (error) => sendResponse({ success: false, error: error.message });
    socket.onclose = function(event) {
      console.warn("WebSocket closed:", event.code, event.reason, event.wasClean);
  };

    return true; // Required for async sendResponse
}
});