d3.csv('data/citation/IEEE VIS papers 1990-2020 - Main dataset.csv', function (error, data) {
    // console.log(data);
    // data = data.filter(d=>parseInt(d.Year) >= 2016 && parseInt(d.Year) <= 2020)
    let network = getCoauthorNetwork(data, 5);
    // let network = getCitationNetwork(data, 10);
    // console.log(network);
    netClustering.cluster(network.nodes, network.links);
    // console.log(network);
    console.log(JSON.stringify(network));

});

/* global d3 */

//builds a d3 network of author citations
getCitationNetwork = function (data, minLinkValue) {
    var nodes = [], edges = [];
    var nodesMap = d3.map();
    var papersMap = d3.map();
    var edgesCount = d3.map();
  
    minLinkValue = minLinkValue!==undefined? minLinkValue: 10;
  
    function getNodeOrCreate(t, node) {
      if (!nodesMap.has(t)) {
        nodesMap.set(t, {"name":t, "value":0, "numPapers": 0, "node":node, "cluster":null});
      }
      return nodesMap.get(t);
  
    }
  
    function addCount(t, onode, value) {
      var node = getNodeOrCreate(t, onode);
      node[value]+=1;
      nodesMap.set(t, node);
      return node;
    }
  
    data.forEach(function (d) {
      papersMap.set(d.Link, d);
      papersMap.set(d.DOI, d);
    });
  
    data.forEach(function (d) {
      if (d.InternalReferences === undefined) {
        return;
      }
      var citations;
      if (d.InternalReferences.indexOf(",")!== -1) {
        citations = d.InternalReferences.split(",");
      }else {
        citations = d.InternalReferences.split(";");
      }
      if (!citations) return;
  
      var source = d;
  
      citations.forEach(function (c) {
        if (!c) return;
        var target = papersMap.get(c);
  
        source["AuthorNames-Deduped"].split(";").forEach(function (sa){
          addCount(sa, target, "numPapers");
          target["AuthorNames-Deduped"].split(";").forEach(function (ta){
            addCount(ta, target, "value");
            // if (sa==="Cox, D. C." || ta==="Cox, D. C.") { return; }
            if (sa===ta) { return; }
            var key = sa + "|" + ta;
            if (edgesCount.has(key)){
              edgesCount.set(key, edgesCount.get(key) + 1 );
            } else {
              edgesCount.set(key, 0);
            }
  
          });
        });
      });
    });
  
  
    edges = edgesCount.entries()
      .filter(function (d) { return d.value > minLinkValue; } )
      .map(function (d)  {
        var t1,t2;
        t1 = d.key.split("|")[0];
        t2 = d.key.split("|")[1];
        var node1 = getNodeOrCreate(t1);
        var node2 = getNodeOrCreate(t2);
        if (node1.visible===undefined || node1.visible===0) {
          node1.visible = d.value > minLinkValue ? 1 : 0;
        }
        if (node2.visible===undefined || node2.visible===0) {
          node2.visible = d.value > minLinkValue ? 1 : 0;
        }
        if (nodes.indexOf(node1)===-1) { nodes.push(node1); }
        if (nodes.indexOf(node2)===-1) { nodes.push(node2); }
        return {
          source:node1,
          target:node2,
          type:"cites",
          value:d.value
        };
      });
    return {"nodes":nodes, "links":edges};
};

//builds a d3 network author collaboration
getCoauthorNetwork = function (data, minLinkValue) {
var nodes = [], edges = [];
var nodesMap = d3.map();
var edgesCount = d3.map();

minLinkValue = minLinkValue!==undefined? minLinkValue: 10;

function getNodeOrCreate(t) {
    var node;
    if (!nodesMap.has(t)) {
    nodesMap.set(t, {"name":t, "value":0, "visible":false, "cluster":"-1"});
    }
    return nodesMap.get(t);

}

function addCount(t) {
    var node = getNodeOrCreate(t);
    node.value+=1;
    nodesMap.set(t, node);
    return node;
}

data.forEach(function (d) {
    var author = d["AuthorNames-Deduped"].split(";");
    author.forEach(function (t1) {
    author.forEach(function (t2) {
        if (t1===t2) {
        return;
        }
        addCount(t1);
        addCount(t2);

        var key = t1<t2 ? t1 + "|" + t2 : t2 + "|" + t1;
        if (edgesCount.has(key)){
        edgesCount.set(key, edgesCount.get(key) + 1 );
        } else {
        edgesCount.set(key, 0);
        }

    });
    });
});


edges = edgesCount.entries()
    .filter(function (d) { return d.value > minLinkValue; } )
    .map(function (d)  {
    var t1,t2;
    t1 = d.key.split("|")[0];
    t2 = d.key.split("|")[1];
    var node1 = getNodeOrCreate(t1);
    var node2 = getNodeOrCreate(t2);
    if (node1.visible===undefined || node1.visible===0) {
        node1.visible = d.value > minLinkValue ? 1 : 0;
    }
    if (node2.visible===undefined || node2.visible===0) {
        node2.visible = d.value > minLinkValue ? 1 : 0;
    }

    if (nodes.indexOf(node1)===-1) { nodes.push(node1); }
    if (nodes.indexOf(node2)===-1) { nodes.push(node2); }

    return {
        source:node1,
        target:node2,
        value:d.value
    };
    });
return {"nodes":nodes, "links":edges};
};