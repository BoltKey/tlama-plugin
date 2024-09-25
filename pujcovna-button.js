console.log("making pujcovna button");

var documentTemplate = `<style>
p.high-line {
    line-height: 1.6;
}
span.najemce {
	margin-right: 300px;
}
div.signatures {
	height: 70px;
    display: table-cell;
    vertical-align: middle;
}
.right-margin {
	margin-right: 100px;
    height: 50px;
    display: inline-block;
}
</style>
<body onafterprint="self.close()" onload="self.print()" contenteditable="true">
<h1>
Smlouva o nájmu věcí movitých
</h1>
<p class='high-line'>
Smlouva se uzavírá dle aktuálního provozního řádu půjčovny zveřejněného na www.tlamagames.com a to mezi: <br>
TLAMA games - Miroslav Tlamicha<br>
IČ: 762 92 941, DIČ: CZ8502160040<br>
se sídlem:<br>
Budečská 1026/14, Praha 2  120 00<br>
kontaktní údaje:<br>
adresa pro vyzvednutí a vrácení vypůjčených her: Třebohostická 2283/2 Praha 10 – Strašnice 100 00<br>
email: info@tlamadesign.com<br>
telefon (prodejna Třebohostická): +420 776 488 060<br>
(dále jen „pronajimatel“)<br>
a nájemcem (doplňte):<br>
<span id="customer-info">Jméno zákazníka</span><br>

Předmětem nájmu jsou následující hry a příslušenství:<br>
</p>
<ul id="articles">
</ul>
<p class='high-line'>
Nájemce podpisem níže stvrzuje, že přebral výše uvedené položky.<br>
Při podpisu byla složena kauce ve výši <span id="deposit"></span> Kč. <br>
Forma úhrady: hotově / karetní blokace (nehodící se škrtněte)<br>
Objednávka nájemce ze dne <span id="date-from"></span>. <br>
Půjčovné je ve výši uvedené v objednávce: <span id="lending-fee"></span> Kč. <br>
Nájemce se zavazuje hry vrátit do <span id="date-to"></span>.<br>
<div class='signatures'>
<span class='najemce'>Nájemce</span><span id="pronajimatel">Pronajimatel</span> <br>
</div>
<span class='right-margin'>Vráceno dne:</span> bez výhrad / s výhradou (doplňte) <br>
Pokuta či úhrada škody: ne / ano ve výši: <br>

<div class='signatures'>
<span class='najemce'>Nájemce</span><span id="pronajimatel">Pronajimatel</span> <br>
</div>


</p>
</body>`;

function main() {
	var button = document.createElement("button");
	button.className = "btn btn-md btn-default dropdown-trigger pujcovna-button";
	button.style["margin-left"] = "5px";
	button.innerHTML = "Půjčovna: tisk smlouvy"
	document.querySelector(".content-buttons").appendChild(button);
	button.addEventListener("click", createAgreement);

  for (let cell of document.querySelectorAll("tbody .v2table__cell--number[data-testid=cellOrderItemAmount]")) {
    if (!cell.innerHTML.includes("1")) {
      cell.style.backgroundColor = "lightpink";
    }
  }
}

function createAgreement() {
	var newWindow = window.open("", "Smlouva k půjčovně", 'status=1,width=800,height=800');
	newWindow.document.write(documentTemplate);
	var d = newWindow.document;
	var address = document.querySelector("#billing-address span").innerHTML;
	d.getElementById("customer-info").innerHTML = address;
	var items = document.querySelectorAll("#t1 .tableWrapper tbody tr:not(.hidden)");
	console.log(items);
	var i = 0;
	for (var item of items) {
		if (item.children[1].innerText == "") {
			continue;  // no product code
		}
		var newChild = d.createElement("li");
		newChild.innerHTML = item.children[3].children[0].innerHTML;
		d.getElementById("articles").appendChild(newChild);
	}
	var price = document.querySelector(".total-price big").innerHTML.replace(/\D/g,'')/100;
	console.log("price", price);
	d.getElementById("deposit").innerHTML = price * 10;
	d.getElementById("lending-fee").innerHTML = price;

	var date = new Date();
	var stringFrom = date.toLocaleDateString('cs-CZ');
	d.getElementById("date-from").innerHTML = stringFrom;
	date.setDate(date.getDate() + 7);
	var stringTo = date.toLocaleDateString('cs-CZ');
	d.getElementById("date-to").innerHTML = stringTo;
}

onload = main;