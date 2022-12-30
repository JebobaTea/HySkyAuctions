import cache
import threading
from tqdm import tqdm
import fuckit
import json
from flask import Flask, render_template, jsonify, request


app = Flask("")


@app.route("/")
def index():
    return render_template("home.html")


@app.route("/api/page")
def auctionsByPage():
    page = request.args.get('p')
    params = 0
    t = request.args.get('type')
    if t is not None and t != "All":
        params += 1
    tier = request.args.get('tier')
    if tier is not None and tier != "All":
        params += 1
    query = request.args.get('query')
    if query is not None:
        params += 1
    caching = cache.isCaching()
    if caching:
        return jsonify({"caching": "true"})
    data = cache.getCache()
    data = json.loads(data)
    auctionList = []
    for key, value in data.items():
        temp = [key, value]
        auctionList.append(temp)
    filteredAuctions = []
    for k in auctionList:
        p = 0
        if t == "BIN" and k[1]["bin"]:
            p += 1
        elif t == "Auctions" and not k[1]["bin"]:
            p += 1
        if tier is not None and tier != "All" and k[1]["tier"] == tier:
            p += 1
        if query is not None and query.lower() in k[1]["item_name"].lower():
            p += 1
        if p == params:
            filteredAuctions.append(k)
    pages = [filteredAuctions[i:i + 30] for i in range(0, len(filteredAuctions), 30)]
    return jsonify({"caching": "false", "pages": len(pages), "auctions": pages[int(page)]})

@app.route("/api/id")
def auctionsByID():
    id = str(request.args.get('id'))
    caching = cache.isCaching()
    if caching:
        return jsonify({"caching": "true"})
    data = cache.getCache()
    data = json.loads(data)
    return jsonify({"caching": "false", "auction": data[id]})

@fuckit
def deploy():
    app.run(host="0.0.0.0")


#cacheThread = threading.Thread(target=cache.cache)
#appThread = threading.Thread(target=deploy)

#appThread.start()
#cacheThread.start()

app.run(host="0.0.0.0", debug=True)