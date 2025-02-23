function extractProductUrl(htmlString) {
  // Use DOMParser to parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Query the <a> inside .snippets-suggestion
  const anchor = doc.querySelector(".snippets-suggestion a");

  // Return its href value if found
  return anchor ? anchor.getAttribute("href") : null;
}

const vendorBaseUrl = {
  "Blackfire": "https://www.blackfire.eu",
  "Asmodee NL": "https://webshopnl.asmodee.com",
  "epn": "https://www.epn-europe.com",
  "frontdepot": "https://shop.frontdepot.com",
  "pegasus": "https://b2b.pegasusshop.de/en"
}

async function updateVendorData(vendorId, productName, EAN) {
  let url = {
    "Asmodee NL": ["https://webshopnl.asmodee.com/en-us/productlist/searchsuggestions?term="],
    "Blackfire": ["https://www.blackfire.eu/en-gb/productlist/searchsuggestions?term="],
    //"bnw": ws, handled separately,
    "epn": ["https://www.epn-europe.com/productlist/searchsuggestions?term="],
    "frontdepot": ['https://shop.frontdepot.com/io?io={%22name%22:%22suggestions%22,%20%22params%22:[%22', '%22]}'],
    "pegasus": ["https://b2b.pegasusshop.de/en/ajax_search?sSearch="]
  }[vendorId]
  if (vendorId === "bnw") {
    console.log("updating", {vendorId, EAN})
    chrome.runtime.sendMessage(
      { action: "bnwStartWS", searchTerm: EAN }
    )
    return;
  }
  console.log("updating", vendorId, "with", EAN)
  EAN = EAN.replace(/\– EN$/g, "")
  EAN = EAN.replace(/\- EN$/g, "")
  console.log("adjusted EAN:", EAN)
  let toFecth = url[0] + EAN + (url[1] ?? "")
  toFecth = toFecth.replace(/ /g, "%20")
  console.log(vendorId, toFecth)
  chrome.runtime.sendMessage(
    { action: vendorId === "pegasus" ? "fetchPage" : "fetchData", url: toFecth },
    (response) => {
      if (response.success) {
        console.log(vendorId, response);
        if (vendorId === "pegasus") {
          let parser = new DOMParser();
          let doc = parser.parseFromString(response.data, "text/html");
          response.data = [...doc.querySelectorAll(".search-result--link")].map(link => {
            return {
              Url: link.href,
              keyword: link.querySelector(".entry--name")?.innerText
            }
          }).filter(k => k.keyword)
          console.log("pegasus data", response.data)
        }
        // Ensure response.data contains the correct property
        let tlamaPriceElement = document.getElementById(`${vendorId}:vendor-price`)
        let tlamaStockElement = document.getElementById(`${vendorId}:vendor-stock`)
        let foundByElement = document.getElementById(`${vendorId}:vendor-product-found`)
        let tlamaLink = document.getElementById(`${vendorId}:name`)
        console.log("found for ", vendorId, response.data)
        if (response.data.length > 1) {
          let tlamaTargetWord = EAN.replace(/[^a-zA-Z0-9]/g, "");

          response.data = response.data.filter(a => tlamaTargetWord.includes(a.keyword?.replace(/[^a-zA-Z0-9]/g, "")) ||
          tlamaTargetWord.includes(a.Title?.replace(/[^a-zA-Z0-9]/g, "")))
        }
        if (response.data && response.data.length === 1) {
          let targetResult = response.data[0];
          let url = vendorBaseUrl[vendorId]
          let productPath = targetResult.Url
          let productUrl;
          if (productPath) {
            if (productPath.startsWith("http")) {
              productUrl = productPath
            }
            else {
              productUrl = `${url}${productPath}`
            }
          }
          if (!productPath) {
            productUrl = extractProductUrl(targetResult.suggestion)
          }
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
              let priceElement = doc.querySelector(".lbl-price, .price_wrapper .price.h1, .price--default.toogle--price");
              let stockElement = doc.querySelector(".erpbase_stocklevel, .lbl-stock, .status.status-2, .delivery--text");
              console.log({priceElement, stockElement})

              let price = priceElement ? priceElement.innerText.trim() : "Price not found";
              let stock = stockElement ? stockElement.innerText.trim() : "Stock status not found";

              console.log("Price:", price);
              console.log("Stock:", stock);
              tlamaPriceElement.innerText = price
              tlamaStockElement.innerText = stock
              foundByElement.innerText = EAN
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
  for (let hName of ["Dodavatel", "Název u dodavatele", "Cena", "Skladem"]) {
    let h = document.createElement("th");
    h.innerHTML = hName;
    hr.appendChild(h)
  }
  table.appendChild(hr)
  for (let vendorId of [
    "Asmodee NL",
    "Blackfire",
    //"bnw": ws,
    "epn",
    "frontdepot",
    "pegasus"
  ]) {
    let row = document.createElement("tr")
    for (let colName of ["name", "vendor-product-found", "vendor-price", "vendor-stock"]) {
      let td = document.createElement("td")
      td.id = vendorId + ":" + colName
      row.appendChild(td)
      if (colName === "name") {
        td.innerHTML = `<a href=${vendorBaseUrl[vendorId]}>${vendorId}</a>`
      }
    }
    table.appendChild(row)
  }
  document.querySelector("#productDetailStockCardNest")?.insertAdjacentElement("beforebegin", table)
}

function searchVendors() {
  let ean = document.querySelector("input[name='ean']").value
  for (let vendorId of ["Blackfire", "Asmodee NL", "bnw", "epn", "frontdepot", "pegasus"]) {
    updateVendorData(vendorId, document.querySelector("[data-clipboard] strong").innerHTML, ean)
  }
}

function main() {
  addTable();
  searchVendors();
}

onload = main;