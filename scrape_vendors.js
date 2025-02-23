async function updateVendorData(vendorId, productName, EAN) {
  let url = {
    "Blackfire": ["https://www.blackfire.eu/en-gb/productlist/searchsuggestions?term="],
    "Asmodee NL": ["https://webshopnl.asmodee.com/en-us/productlist/searchsuggestions?term="],
    "epn": ["https://www.epn-europe.com/productlist/searchsuggestions?term="],
    "frontdepot": ['https://shop.frontdepot.com/io?io={%22name%22:%22suggestions%22,%20%22params%22:[%22', '%22]}']
  }[vendorId]
  if (vendorId === "bnw") {
    console.log("updating", {vendorId, EAN})
    chrome.runtime.sendMessage(
      { action: "bnwStartWS", searchTerm: EAN }
    )
    return;
  }
  let toFecth = url[0] + EAN + (url[1] ?? "")
  console.log(vendorId, toFecth)
  chrome.runtime.sendMessage(
    { action: "fetchData", url: toFecth },
    (response) => {
      if (response.success) {
        console.log(vendorId, response);
        // Ensure response.data contains the correct property
        let tlamaPriceElement = document.getElementById(`${vendorId}:vendor-price`)
        let tlamaStockElement = document.getElementById(`${vendorId}:vendor-stock`)
        let tlamaLink = document.getElementById(`${vendorId}:name`)
        console.log("found for ", vendorId, response.data)
        if (response.data.length > 1) {
          response.data = response.data.filter(a => EAN.includes(a.keyword) || EAN.includes(a.Title))
        }
        if (response.data && response.data.length === 1) {
          let targetResult = response.data[0];
          let url = {
            "Blackfire": "https://www.blackfire.eu",
            "Asmodee NL": "https://webshopnl.asmodee.com",
            "epn": "https://www.epn-europe.com"
          }[vendorId]
          let productUrl = `${url}${targetResult.Url}`
          chrome.runtime.sendMessage(
            {
              action: "fetchPage",
              url: productUrl
            },
            (secondResponse) => {
              let page = secondResponse.data;

              // Convert page string to a DOM document
              let parser = new DOMParser();
              let doc = parser.parseFromString(page, "text/html");

              console.log(doc)

              // Example usage of querySelector
              let priceElement = doc.querySelector(".lbl-price");
              let stockElement = doc.querySelector(".erpbase_stocklevel, .lbl-stock");
              console.log({priceElement, stockElement})

              let price = priceElement ? priceElement.innerText.trim() : "Price not found";
              let stock = stockElement ? stockElement.innerText.trim() : "Stock status not found";

              console.log("Price:", price);
              console.log("Stock:", stock);
              tlamaPriceElement.innerText = price
              tlamaStockElement.innerText = stock
              tlamaLink.innerHTML = `<a target='_blank' href=${productUrl}>${vendorId}</a>`
            }
          );
        } else {
          tlamaStockElement.innerHTML = "Not found"
          tlamaStockElement.innerHTML = "Not found"
          if (productName) {
            // try again with board game name
            updateVendorData(vendorId, undefined, productName)
          }
          console.error("Unexpected response format or missing Url property for:", vendorId, response.data);
        }
      } else {
        console.error("Error fetching data from ", toFecth, response.error);
        if (productName) {
          // try again with board game name
          updateVendorData(vendorId, undefined, productName)
        }
      }
    }
  );
}

async function test() {
  await updateVendorData("Blackfire", "Agricola", "4260402315287");
}

function addTable() {
  let table = document.createElement("table")
  table.classList.add("v2table")
  table.id = "vendor-data"
  let hr = document.createElement("tr")
  for (let hName of ["Dodavatel", "Cena", "Skladem"]) {
    let h = document.createElement("th");
    h.innerHTML = hName;
    hr.appendChild(h)
  }
  table.appendChild(hr)
  for (let vendorId of ["Blackfire", "Asmodee NL", "bnw", "frontdepot"]) {
    let row = document.createElement("tr")
    for (let colName of ["name", "vendor-price", "vendor-stock"]) {
      let td = document.createElement("td")
      td.id = vendorId + ":" + colName
      row.appendChild(td)
      if (colName === "name") {
        td.innerHTML = vendorId
      }
    }
    table.appendChild(row)
  }
  document.querySelector("#productDetailStockCardNest")?.insertAdjacentElement("beforebegin", table)
}

function searchVendors() {
  let ean = document.querySelector("input[name='ean']").value
  for (let vendorId of ["Blackfire", "Asmodee NL", "bnw", "epn", "frontdepot"]) {
    updateVendorData(vendorId, document.querySelector("[data-clipboard] strong").innerHTML, ean)
  }
}

function main() {
  addTable();
  searchVendors();
}

onload = main;