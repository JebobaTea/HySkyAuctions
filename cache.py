import requests
import json
from time import sleep, time

baseURL = "https://api.hypixel.net/skyblock/auctions?page="
data = {}
total = 0
caching = False

def isCaching():
    global caching
    return caching

def getCache():
    with open("cache.json") as f:
        return f.read()

def getPage(page):
    resp = requests.get(baseURL + str(page))
    return resp.json()

def parseAuctions(auc):
    auctions = []
    for auction in auc:
        if not auction["claimed"]:
            auction.pop("uuid")
            auction.pop("profile_id")
            auction.pop("coop")
            auction.pop("extra")
            auction.pop("item_bytes")
            if "item_uuid" in auc:
                auction.pop("item_uuid")
            auction.pop("claimed")
            auction.pop("claimed_bidders")
            for a in auction["bids"]:
                a.pop("auction_id")
                a.pop("profile_id")
            auctions.append(auction)
    return auctions

def cache():
    global caching
    global total
    while True:
        print("\033[93mBeginning caching...\033[0m")
        start = time()
        r = getPage(0)
        pages = r.get("totalPages", 0)
        auctions = r.get("totalAuctions", 0)
        total = 0
        for i in range(0, pages):
            auc = getPage(i).get("auctions")
            auc = parseAuctions(auc)
            for auction in auc:
                total += 1
                data[total] = auction
        end = time()
        print("\033[93mFinished caching for " + str(pages) + " pages and " + str(auctions) + " auctions in " + str(round(end-start)) + " seconds\033[0m")
        print("\033[93mWriting to file\033[0m")
        caching = True
        with open("cache.json", "w") as f:
            json.dump(data, f)
        caching = False
        print("\033[93mComplete, waiting for refresh...\033[0m")
        sleep(60)
