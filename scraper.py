import asyncio
import aiohttp
import aiofiles
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

BASE_URL = "https://agiriko.digital/docs"
OUTPUT_DIR = Path("./data")

STATES = {
    "(Client)": "client",
    "(Server)": "server",
    "(Shared)": "shared"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

SEMAPHORE = asyncio.Semaphore(10)  # limite de requêtes simultanées


# -------------------------
# Parser une fonction
# -------------------------
def parse_function(elements, class_name):
    func = {
        "name": "",
        "className": class_name,
        "realm": "shared",
        "signature": "",
        "returnType": None,
        "returnDescription": "",
        "description": "",
        "arguments": [],
        "examples": []
    }

    for elem in elements:
        if elem.name == "p":
            code_elem = elem.find("code")
            if code_elem:
                func["signature"] = code_elem.get_text(strip=True)

                sName = re.search(r"(\w+)\s*\(", func["signature"])
                if sName:
                    func["name"] = sName.group(1)

            sText = elem.get_text(strip=True)
            lSplit = sText.split(" ")
            Realm = lSplit[0] if lSplit[0] in STATES else None
            if Realm and not func["description"]:
                func["realm"] = STATES[Realm]
                func["description"] = sText.replace(Realm, "").strip()

            if lSplit[0] == "Returns:":
                func["returnType"] = lSplit[1] if len(lSplit) > 1 else None
                func["returnDescription"] = " ".join(lSplit[2:]) if len(lSplit) > 2 else ""
        elif elem.name == "ul":
            for li in elem.find_all("li"):
                arg_text = li.get_text(strip=True)

                arg_parts = arg_text.split(" ")
                if len(arg_parts) >= 2:
                    arg_type = arg_parts[0]
                    arg_description = " ".join(arg_parts[1:])
                    func["arguments"].append({
                        "type": arg_type,
                        "description": arg_description
                    })

    # pRINT Tableau final
    #print(f'   - Fonction finale: {func}')

    return func


# -------------------------
# Parser les fonctions d'une page
# -------------------------
def parse_functions_from_page(soup, class_name):
    functions = []

    body_children = [
        el for el in soup.body.children
        if hasattr(el, "name") and el.name
    ]


    # for elem in body_children:
    #     if elem.name == "hr":
    #         continue

    #     func = parse_function([elem], class_name)
    #     if func["name"]:
    #         functions.append(func)

    # Prendre tous les éléments entre chaque <hr> comme un groupe
    group = []
    for elem in body_children:
        if elem.name == "hr":
            if group:
                func = parse_function(group, class_name)
                if func["name"]:
                    functions.append(func)
                group = []
        else:
            group.append(elem)

    if group:
        func = parse_function(group, class_name)
        if func["name"]:
            functions.append(func)

    return functions


# -------------------------
# Fetch async
# -------------------------
async def fetch(session, url):
    async with SEMAPHORE:
        async with session.get(url, headers=HEADERS) as resp:
            return await resp.text()


# -------------------------
# Scraper une page
# -------------------------
async def scrape_page(session, url, name):
    try:
        print(f"📥 Scraping: {name}")
        html = await fetch(session, url)
        soup = BeautifulSoup(html, "html.parser")

        main_desc = ""
        first_p = soup.select_one("body > p")
        if first_p:
            main_desc = first_p.get_text(strip=True)

        functions = parse_functions_from_page(soup, name)

        print(f"   ✓ {len(functions)} fonction(s) trouvée(s)")

        return {
            "name": name,
            "url": url,
            "description": main_desc,
            "functions": functions,
            "rawContent": soup.body.get_text()
        }

    except Exception as e:
        print(f"❌ Erreur scraping {name}: {e}")
        return None


# -------------------------
# Parser l'index
# -------------------------
async def parse_index(session):
    print("📋 Parsing de l'index...\n")
    html = await fetch(session, BASE_URL)
    soup = BeautifulSoup(html, "html.parser")

    structure = {}

    for h1 in soup.find_all("h1"):
        category_name = h1.get_text(strip=True)

        if category_name == "MicroWorks Scripting Documentation":
            continue

        ul = h1.find_next("ul")
        if not ul:
            continue

        items = []
        for link in ul.find_all("a"):
            href = link.get("href")
            text = link.get_text(strip=True)
            if href and text:
                items.append({
                    "name": text,
                    "url": f"{BASE_URL}/{href}",
                    "slug": href.replace(".html", "")
                })

        if items:
            structure[category_name.lower()] = {
                "name": category_name,
                "count": len(items),
                "items": items
            }

    return structure


# -------------------------
# Scraper toute la doc
# -------------------------
async def scrape_all_docs():
    print("🚀 Démarrage du scraping agiriko.digital (ASYNC)...\n")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    async with aiohttp.ClientSession() as session:
        structure = await parse_index(session)

        async with aiofiles.open(OUTPUT_DIR / "structure.json", "w", encoding="utf-8") as f:
            await f.write(json.dumps(structure, indent=2, ensure_ascii=False))

        all_data = {
            "scrapedAt": datetime.utcnow().isoformat(),
            "categories": {},
            "totalFunctions": 0
        }

        for cat_key, category in structure.items():
            print(f"\n📁 Catégorie: {category['name']}")

            tasks = []
            for item in category["items"]:
                tasks.append(scrape_page(session, item["url"], item["name"]))

            results = await asyncio.gather(*tasks)

            all_data["categories"][cat_key] = {
                "name": category["name"],
                "count": category["count"],
                "items": []
            }

            for page in results:
                if page:
                    all_data["categories"][cat_key]["items"].append(page)
                    all_data["totalFunctions"] += len(page["functions"])

        async with aiofiles.open(
            OUTPUT_DIR / "scraped-data-advanced.json", "w", encoding="utf-8"
        ) as f:
            await f.write(json.dumps(all_data, indent=2, ensure_ascii=False))

        print("\n✅ Scraping terminé !")
        print(f"📊 Total: {all_data['totalFunctions']} fonctions")

        return all_data


# -------------------------
# Main
# -------------------------
if __name__ == "__main__":
    asyncio.run(scrape_all_docs())
