var priceElement = document.querySelector(".prices .lbl-price");
var description = document.querySelector(".description")
if (window.location.href.includes("pegasusshop.de")) {
  priceElement = document.querySelector(".product--price .price--content");
  description = document.querySelector(".product--description")
}
var eurPrice = parseFloat(priceElement.innerText.replace(",", ".").slice(1));
var DPH = 1.21
var EUR = 25.11
var coefficient = DPH * EUR;
var book = false;
if (description.innerHTML.includes("book")) {
	coefficient = EUR;
	var book = true;
}
var czkPrice = eurPrice * coefficient;
priceElement.innerHTML += "<span class='tlama-price'>= " + Math.round(czkPrice) + " CZK</span>" + (book ? " (kniha)" : "");
description.insertAdjacentHTML("beforebegin", "<button class='tlama-ean-code uncopied'>Zkopíruj GTIN</button>");
document.querySelector(".tlama-ean-code").addEventListener("click", function() {
  if (window.location.href.includes("pegasusshop.de")) {
    var eanElement = document.querySelectorAll(".props-table--entry.is--value")[1]
  }
  else {
    var eanElement = document.querySelectorAll(".gvi-name-value tr")[2].childNodes[3]
  }
  var eanCode = eanElement.textContent.replace(/ /g,'');
	navigator.clipboard.writeText(eanCode);
	document.querySelector(".tlama-ean-code").className = "tlama-ean-code";
})

console.log("TLAMA here");