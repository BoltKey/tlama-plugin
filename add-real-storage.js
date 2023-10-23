function getProductLinks(orderPageText) {
	var parser = new DOMParser();
	var orderDoc = parser.parseFromString(orderPageText, "text/html");
	var linkElements = orderDoc.querySelectorAll("table a");
	var links = [];
	for (var e of linkElements) {
		links.push(e.href);
	}
	return links;
}

function addReal() {

	var params = new URLSearchParams(window.location.href)
	for (var [name, val] of params) {
		if (name == "ids") {   
			var orderIds = val.split("|");
			for (var id of orderIds) {
				(function(id) {
					var req = new XMLHttpRequest();
					req.addEventListener("load", function() {
						for (var link of getProductLinks(this.responseText)) {
							console.log(link);
						}
					});
					req.open("GET", "https://www.tlamagames.com/admin/action/OrdersListing/GetOrderDetail/?id=" + id);
					req.send();
				}(id));
			}
		}
}
}

console.log("here");
addReal();

var newBody = document.body

document.body.onload = function() {}
//document.body.setAttribute("onload", "");