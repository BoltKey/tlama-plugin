function main() {
  var button = document.createElement("button");
  button.className = "btn btn-md btn-default dropdown-trigger pujcovna-button";
  button.style["margin-left"] = "5px";
  button.innerHTML = "Zkopírovat adresy pro email o nedostupnosti";
  document.querySelector(".content-buttons").appendChild(button);
  button.addEventListener("click", sendEmail);
}

function showPopup(message) {
  const button = document.querySelector(".pujcovna-button");
  if (!button) return;

  document.querySelector(".email-outofstock-popup")?.remove();
  const popup = document.createElement("div");
  popup.className = "email-outofstock-popup";
  popup.textContent = message;
  Object.assign(popup.style, {
    position: "fixed",
    left: `${button.getBoundingClientRect().left}px`,
    top: `${button.getBoundingClientRect().bottom + 6}px`,
    zIndex: "99999",
    padding: "8px 12px",
    background: "#333",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "13px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
  });
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

async function sendEmail() {
  let history = await fetch(document.querySelector(".export-data").href);
  let historyText = await history.text(); // csv
  /*
  date;documentType;documentCode;itemCode;variantName;stock;previousState;change;actualState;summaryPrevious;summaryActual;customer;email;
"2026-02-10 10:27:06.000000";"order";"26029868";"103789";"";"T�ebohostick�, Praha 10";"-7";"1";"-6";"-7";"-6";"Loki";"loki@tlamagames.com";
*/
  const sanitizeField = (value = "") =>
    value
      .replace(/\r/g, "")
      .replace(/\\"/g, '"')
      .replace(/^"(.*)"$/, "$1")
      .replace(/"+$/g, "")
      .trim();

  const parseCsvLine = (line) => {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ";" && !inQuotes) {
        fields.push(sanitizeField(current));
        current = "";
        continue;
      }

      current += char;
    }

    fields.push(sanitizeField(current));
    return fields;
  };

  let historyParsed = historyText
    .replace(/^\uFEFF/, "") // drop BOM
    .replace(/\r/g, "") // normalize newlines
    .trim()
    .split("\n")
    .slice(1) // remove header
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [
        date,
        documentType,
        documentCode,
        itemCode,
        variantName,
        stock,
        previousState,
        change,
        actualState,
        summaryPrevious,
        summaryActual,
        customer,
        email,
      ] = parseCsvLine(line);
      return {
        date,
        documentType,
        documentCode,
        itemCode,
        variantName,
        stock,
        previousState,
        change,
        actualState,
        summaryPrevious,
        summaryActual,
        customer,
        email: sanitizeField(email),
      };
    });
  console.log(historyParsed);
  let ean = document.querySelector("input[name='ean']").value;
  let productName = document.querySelector("[data-clipboard] strong").innerHTML;
  let currStock = document.querySelector(
    "td[data-testid='cellStockRealAmount']",
  ).innerHTML;
  let demand = document.querySelector(
    "td[data-testid='cellStockClaim']",
  ).innerHTML;
  let availableAmt = demand - currStock;
  let availabilityOnSoldOut =
    document.querySelector("select[name='availabilityId'] option:checked")
      ?.innerHTML ?? "";
  if (availableAmt <= 0) {
    showPopup(
      "Produkt je skladem v dostatečném množství, není potřeba posílat email.",
    );
    return;
  }
  setTimeout(() => {
    document.querySelectorAll(".show-tooltip.text-tooltip").forEach((el) => {
      el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
  }, 100);

  let wantedAmt = {};
  let orderEmails = {};
  for (let h of historyParsed) {
    if (!wantedAmt[h.documentCode]) {
      wantedAmt[h.documentCode] = 0;
    }
    wantedAmt[h.documentCode] -= parseInt(h.change);
    if (h.email) {
      orderEmails[h.documentCode] = sanitizeField(h.email);
    }
    availableAmt -= parseInt(h.change);
    if (availableAmt <= 0) {
      break;
    }
  }
  console.log(wantedAmt, orderEmails);
  let targetRecipients = Object.keys(wantedAmt).filter(
    (code) => wantedAmt[code] > 0,
  );
  let recipients = [
    ...new Set(
      targetRecipients.map((code) => orderEmails[code]).filter(Boolean),
    ),
  ];

  // sleep to flush the UI and show the alert before sending emails
  setTimeout(() => {
    if (recipients.length === 0) {
      showPopup("Nenalezen žádný email pro zaslání upozornění.");
      return;
    }
    const subject = `TLAMA games - Položka ${productName} změnila dostupnost na ${availabilityOnSoldOut}`;
    const body = `Vážený zákazníku,
položka "${productName}" z Vaší objednávky změnila dostupnost na "${availabilityOnSoldOut}". Omlouváme se za zdržení a případně komplikace. Vaši objednávku odešleme, jakmile budou všechny její položky skladem. Pokud si přejete jiný postup, neváhejte nás kontaktovat.
S pozdravem
Tým TLAMA games`;
    const recipientList = recipients.join(",");
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&to=info@tlamagames.com&bcc=${encodeURIComponent(recipientList)}&body=${encodeURIComponent(body)}`;
    // open in new tab to avoid losing the current page
    //window.open(mailtoLink, "_blank");
    // put recipient list into clipboard
    navigator.clipboard.writeText(recipientList).then(
      () => showPopup("Seznam příjemců byl zkopírován do schránky."),
      () => showPopup("Nepodařilo se zkopírovat seznam příjemců do schránky."),
    );
  }, 200);
}

onload = main;
