var priceElement = document.querySelector(".product-info .price-new");
var eurPrice = parseFloat(priceElement.innerText.replace(",", "."));
var coefficient = 30.83;
var book = false;
if (document.querySelector(".description").innerHTML.includes("book")) {
	coefficient = 28.03;
	var book = true;
}
var czkPrice = eurPrice * coefficient;
priceElement.innerHTML += "<span class='tlama-price'>= " + Math.round(czkPrice) + " CZK</span>" + (book ? " (kniha)" : "");

var eanCode = document.querySelectorAll(".description span")[2].nextSibling.textContent.replace(/ /g,'');
document.querySelectorAll(".description span")[2].insertAdjacentHTML("beforebegin", "<button class='tlama-ean-code uncopied'>Zkopíruj</button>");
document.querySelector(".tlama-ean-code").addEventListener("click", function() {
	navigator.clipboard.writeText(eanCode);
	document.querySelector(".tlama-ean-code").className = "tlama-ean-code";
})

console.log("TLAMA here");