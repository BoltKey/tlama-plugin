import pandas as pd

print("hello world")
print("loading products")
products = pd.read_csv("https://www.tlamagames.com/export/products.csv?patternId=183&partnerId=4&hash=e7935270fe86619d14f723a32e153a4e1a48250ca5702cc6ca828b81e8aa91ec", encoding="ISO-8859-1", sep=";")
print("products loaded")

newContent = ""

with open("add-carrier-mark.js", "r", encoding="utf8") as original_file:
  lineFound = False
  linesTotal = 0
  for line in original_file:
    linesTotal += 1
    if not lineFound:
      newContent = newContent + line
    else:
      newContent = newContent + '"products": {\n'
      for index, product in products.iterrows():
        newContent = newContent + "'" + str(product["code"]) + "':\n{name: '" + str(product["name"]).replace("'", "\\'") + "',manufacturer: '" + str(product["manufacturer"]).replace("'", "\\'") + "',ean:'" + str(product["ean"]) + "'},"
      break

    if "const productExport = {" in line:
      print("line found")
      lineFound = True
newContent = newContent + "} }"

text_file = open("add-carrier-mark.js", "w", encoding="utf8")
text_file.write(newContent)
text_file.close()
