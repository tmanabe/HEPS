// ==UserScript==
// @name        HEPS
// @namespace   http://www.dl.kuis.kyoto-u.ac.jp/~manabe/
// @description a HEading-based Page Segmentation algorithm
// @include     *
// @version     1.0.2
// @grant       none
// ==/UserScript==

window.HEPS = top.HEPS || new function () {

    var undefined = void 0,
        ROOT = window.document.body, // Root node of analysis
        EXTRACT_URL = false,
        EXTRACT_PAGE_HEADING = false,
        EXTRACT_TEXT_OF_IMG  = false;

    function MyArray(array) {

        this.push.apply(this, array || []);

        return this;

    }

    MyArray.getGetter = function(key) {

        return function(object) {

            return object[key];

        };

    };

    MyArray.prototype = (function() {

        this.constructor = MyArray;

        this.calcRatio = function(func) {

            var cnt = 0;

            this.forEach(function(replica, i, replicaArray) {

                if(func(replica, i, replicaArray) ) cnt += 1;

            });

            return (cnt / this.length);

        };

        this.concat = function(that) {

            return new MyArray(this.toArray().concat(that.toArray() ) );

        };

        this.getLast = function(i) {

            return this[this.length - 1 + (i || 0)];

        };

        this.map = function() {

            return new MyArray(Array.prototype.map.apply(this, arguments) );

        };

        this.setEvery = function(key, value) {

            this.forEach(function(object) {

                object[key] = value;

            });

        };

        this.toRange = function() {

            return({

                "from": this[0].from,
                "to": this.getLast().to,
                "mandatory": true,

            });

        };

        this.toArray = function() {

            return this.slice(0);

        };

        this.getFrontNodes = function() { // Section 4.3.1

            var targetArray = this,
                resultArray,
                getParent = MyArray.getGetter("parent");

            function isNotNext(replica, i, replicaArray) {

                return replica !== replicaArray[i + 1];

            }

            if(this.frontNodes) return this.frontNodes; // Get cache

            switch(this.length) {

                case 0:

                    resultArray = new MyArray([]);
                    break;

                case 1:

                    resultArray = new MyArray([this[0].root]);
                    break;

                default:

                    while(targetArray.every(isNotNext) ) {

                        resultArray = targetArray;
                        targetArray = targetArray.map(getParent);

                    }

            }

            this.forEach(function(replica, i) {

                replica.frontNode = resultArray[i];

            });

            this.frontNodes = resultArray; // Set cache

            return resultArray;

        };

        this.calcNodeArrays = function() { // Section 4.4.1

            return this.getFrontNodes().map(function(frontNode, i, frontNodes) {

                var targetNode    = frontNode.next,
                    nextFrontNode = frontNodes[i + 1],
                    currentBlock  = frontNode.getContextBlock(),
                    nodeArray     = new MyArray([frontNode]);

                while(!(!targetNode ||              // No following sibling
                    targetNode === nextFrontNode || // Another front node
                    targetNode.hasHeading ||        // Node including headings
                    !currentBlock.includes(targetNode) ) ) {
                    // Node not included in current upper block

                    nodeArray.push(targetNode);
                    targetNode = targetNode.next;

                }

                frontNode.nodeArray = nodeArray;

                return nodeArray;

            });

        };

        return this;

    }).apply(Object.create(Array.prototype) );

    function Replica(node, parentReplica) {

        function chain(elder, younger) {

            elder.next = younger;
            younger.prev = elder;

        }

        function extractPageHeading(node) {

            var document  = node.ownerDocument,
                titleNode = document.getElementsByTagName("title")[0],
                baseNode  = document.getElementsByTagName("base")[0],
                title,
                url,
                locationHref = document.location.href;

            if(titleNode) {

                return normalizeSpace(titleNode.textContent);

            } else {

                if(baseNode && baseNode.href) {

                    url = baseNode.href;

                    if(/\/$/.test(url) )
                        url += new MyArray(locationHref.split("/") ).getLast();

                } else {

                    url = locationHref;

                }

                url = tokenizeURL(url);

                return normalizeSpace(url);

            }

        }

        function getStyle(node, name, context) {

            var getCS  = node.ownerDocument.defaultView.getComputedStyle,
                target = (name === "#text") ? node.parentNode : node,
                styObj = getCS(target, null);

            function parseWeight(value) {

                switch (value) {

                    case "normal": return 400;

                    case "bold":   return 700;

                    default:       return parseInt(value);

                }

            }

            return {

                color:          styObj.color,
                fontSize:       parseFloat(styObj.fontSize),
                fontStyle:      styObj.fontStyle,
                fontWeight:     parseWeight(styObj.fontWeight),
                offsetHeight:   (name === "img") ? node.offsetHeight : "null",
                tagPath:        context + "/" + name,
                textDecoration: styObj.textDecoration,

            };

        }

        function normalizeSpace(string) {

            return string.replace(/\s+/g, " ").replace(/^ | $/g, "");

        }

        function tokenizeURL(url) {

            url = new MyArray(url.split("://") ).getLast();

            return url.split(/\W+/).join(Replica.RAWSTRING_SEP);

        }

        this.name = node.nodeName.toLowerCase();

        if(parentReplica) {

            this.parent = parentReplica;
            this.ancestors = new MyArray([this]).concat(this.parent.ancestors);
            this.style = getStyle(node, this.name, this.parent.style.tagPath);

        } else { // this is root

            if(EXTRACT_PAGE_HEADING) {

                this.pageHeadingRange = {"from": 0, "mandatory": true};
                this.rawString = extractPageHeading(node);
                this.pageHeadingRange.to = this.rawString.length;

            } else {

                this.rawString = "";

            }

            this.id2replica = [];
            this.ancestors = new MyArray([this]);
            this.style = getStyle(node, this.name, "");

        }

        this.root = this.ancestors.getLast();
        this.depth = this.ancestors.length;
        this.id = this.root.id2replica.length; // ID number (== document order)
        this.root.id2replica.push(this);

        if (this.name === "#text") {

            this.isText = true;
            this.content = normalizeSpace(node.textContent);

        } else if (this.name === "img") {

            if(EXTRACT_TEXT_OF_IMG) {

                this.content = normalizeSpace(
                    (node["src"] ? tokenizeURL(node["src"]) : "") +
                    Replica.RAWSTRING_SEP + node["alt"] || "");

            } else {

                this.content = "<IMG:" +
                    encodeURIComponent(node.getAttribute("src") || "no-src") +
                    ">";

            }

        }

        this.from = this.root.rawString.length + Replica.RAWSTRING_SEP.length;
        // Content offset in rawString
        this.hasIDfrom = this.id;

        if(this.content)
            this.root.rawString += (Replica.RAWSTRING_SEP + this.content);

        if(!Replica.IGNORE_CHILDREN_OF[this.name]) {

            [].forEach.call(node.childNodes, function(childNode) {

                if(-1 < Replica.SCAN_CHILDREN_OF.indexOf(childNode.nodeType) ) {

                    this.push(new Replica(childNode, this) );

                    if(1 < this.length) chain(this.getLast(-1), this.getLast() );

                }

            }, this);

        }

        this.to = this.root.rawString.length; // Content limit in rawString
        this.hasIDto = this.getLast() ? this.getLast().hasIDto : this.id;

        return this;

    }

    Replica.IGNORE_CHILDREN_OF = { // Descendants of these nodes will be ignored

        iframe:   true,
        noscript: true,
        script:   true,
        style:    true,

    };

    Replica.RAWSTRING_SEP = " ";

    Replica.NOSRC = "no-src";

    Replica.SCAN_CHILDREN_OF = [Node.ELEMENT_NODE, Node.TEXT_NODE];
    // Scan these types of nodes

    Replica.prototype = (function() {

        this.constructor = Replica;

        this.breaksSentence = function() {

            return (this.next && this.next.isText &&
                this.prev && this.prev.isText);

        };

        this.getContextBlock = function() {

            var i = 0,
                ancestors = this.ancestors,
                ancestorReplica;

            for(; i < ancestors.length; i++) {

                ancestorReplica = ancestors[i];

                if(ancestorReplica.isPartOf) return ancestorReplica.isPartOf;

            }

            return undefined;

        };

        this.includes = function(that) {

            return (this.hasIDfrom <= that.id) && (that.id <= this.hasIDto);

        };

        this.isBlank = function() {

            return (this.isText && !this.content);

        };

        this.merge = function(that, rawString) { // Merge two text replicas

            this.from      = this.from || that.from;
            this.to        = that.to || this.to;
            this.content   = rawString.substring(this.from, this.to);
            this.hasIDfrom = this.hasIDfrom || that.hasIDfrom;
            this.hasIDto   = that.hasIDto || this.hasIDto;
            that.parent.removeChild(that);

            return(this);

        };

        this.removeChild = function(childReplica) {

            this.splice(this.indexOf(childReplica), 1);
            childReplica.parent    = undefined;
            childReplica.ancestors = new MyArray([childReplica]);

            if(childReplica.prev) childReplica.prev.next = childReplica.next;

            if(childReplica.next) childReplica.next.prev = childReplica.prev;

            return childReplica;

        };

        this.stringifyStyle = function() {

            return Object.keys(this.style).sort().map(function(key) {

                return this.style[key];

            }, this).join(";");

        };

        this.toText = function(rawString) {

            var i = this.length - 1;

            this.name    = "#text";
            this.isText  = true;
            this.content = rawString.substring(this.from, this.to);

            for (; 0 <= i; i--) this.removeChild(this[i]);

            return this;

        };

        this.traverse = function(func) {

            var iterate_children = func(this),
                i;

            if(iterate_children) {

                for(i = this.length - 1; 0 <= i; i--) this[i].traverse(func);

            }

        };

        return this;

    }).apply(Object.create(MyArray.prototype) );

    function Block(nodeArray, heading) {

        var content = nodeArray.toRange(),
            contextBlock = nodeArray[0].getContextBlock();

        this.nodeArray = nodeArray;
        nodeArray.setEvery("isPartOf", this);
        this.contents = [content];
        this.children = [];

        if(heading) {

            this.style    = heading.stringifyStyle();
            this.heading  = new MyArray([heading]).toRange();
            this.headings = [ [this.heading] ];
            heading.ancestors.setEvery("hasHeading", true);

        }

        if(contextBlock) contextBlock.children.push(this);

        return this;

    }

    Block.prototype = (function() {

        this.constructor = Block;

        this.includes = function(replica) {

            return this.nodeArray.some(function(part) {

                return part.includes(replica);

            });

        };

        return this;

    }).apply(Object.create(Object.prototype) );

    function preprocess(rootReplica, rawString) { // Section 4.1

        var breakingStyle = {};

        rootReplica.traverse(function(replica) {

            if(replica.isBlank() ) {

                replica.parent.removeChild(replica);

                return false;

            } else return true;

        });

        rootReplica.traverse(function(replica) {

            if(replica.breaksSentence() ) {

                breakingStyle[replica.stringifyStyle()] = replica.next.style;

            }

            return true;

        });

        rootReplica.traverse(function(replica) {

            var newStyle = breakingStyle[replica.stringifyStyle()],
                current;

            if(newStyle) {

                current = replica;
                current.toText(rawString);

                if(current.prev && current.prev.isText)
                    current = current.prev.merge(current, rawString);

                if(current.next && current.next.isText)
                    current.merge(current.next, rawString);

                current.style = newStyle;

                return false;

            } else return true;

        });

    }

    function classify(rootReplica) { // Section 4.2

        var styleHash = {};

        rootReplica.traverse(function(replica) {

            var style;

            if(replica.content) {

                style = replica.stringifyStyle();
                styleHash[style] = styleHash[style] || new MyArray();
                styleHash[style].unshift(replica);

            }

            return true;

        });

        return Object.keys(styleHash).map(function(key) {

            return styleHash[key];

        });

    }

    function sort(nodeLists) { // Section 4.3

        return nodeLists.sort(function(set0, set1) {

            var replica0   = set0[0],
                frontNode0 = set0.getFrontNodes()[0],
                replica1   = set1[0],
                frontNode1 = set1.getFrontNodes()[0];

            return (frontNode0.depth - frontNode1.depth) || // Block depth
                (replica1.style.fontSize - replica0.style.fontSize) ||
                (replica1.style.fontWeight - replica0.style.fontWeight) ||
                (replica0.id - replica1.id); // Document order

        });

    }

    function construct(rootReplica, sortedNodeLists) { // Section 4.4

        var rootBlock = new Block(new MyArray([rootReplica]) );

        function isEmpty(replica) {

            var content = replica.frontNode.nodeArray.toRange();

            return (replica.from <= content.from) &&
                (content.to <= replica.to);

        }

        function hasNoSiblingCandidate(replica0, dummy, nodeList) {

            var context = replica0.getContextBlock();

            return nodeList.every(function(replica1) {

                return !( (replica0 !== replica1) &&
                    (context === replica1.getContextBlock() ) );

            });

        }

        function isNonUnique(replica0, dummy, nodeList) {

            var content = replica0.content,
                context = replica0.getContextBlock();

            return nodeList.some(function(replica1) {

                return ( (replica0 !== replica1) &&
                   (content === replica1.content) &&
                   (context === replica1.getContextBlock() ) );

            });

        }

        function isTooMuch(t) {

            return(function(replica) {

                var content = replica.frontNode.nodeArray.toRange();

                return (content.to - content.from) <
                    t * (replica.to - replica.from);

            });

        }

        sortedNodeLists.forEach(function(nodeList) {

            var frontNodes = nodeList.getFrontNodes();

            frontNodes.calcNodeArrays();

            // Set-level filtering
            nodeList.isFilteredBy = "";

            if(0.1 <= frontNodes.calcRatio(MyArray.getGetter("hasHeading") ) )
                nodeList.isFilteredBy += "Including upper-level headings;";

            if(0.5 <= nodeList.calcRatio(isEmpty) )
                nodeList.isFilteredBy += "Producing empty block;";

            if(0.9 <= nodeList.calcRatio(hasNoSiblingCandidate) )
                nodeList.isFilteredBy += "No sibling candidates;";

            if(0.4 <= nodeList.calcRatio(isNonUnique) )
                nodeList.isFilteredBy += "Non-unique contents;";

            if(0.3 <= nodeList.calcRatio(isTooMuch(1.5) ) )
                nodeList.isFilteredBy += "Too much content as a heading;";

            if(nodeList.isFilteredBy) return;

            nodeList.filter(function(replica) { // Node-level filtering

                return(!(replica.frontNode.hasHeading || isEmpty(replica) ) );

            }).forEach(function(replica) {

                new Block(replica.frontNode.nodeArray, replica);

            });

        });

        return rootBlock;

    }

    this.rootReplica = new Replica(ROOT); // Construct Virtual DOM
    preprocess(this.rootReplica, this.rootReplica.rawString);
    this.nodeLists   = classify(this.rootReplica);
    this.nodeLists   = sort(this.nodeLists);
    this.rootBlock   = construct(this.rootReplica, this.nodeLists);

    if(this.rootReplica.pageHeadingRange)
        this.rootBlock.headings = [ [this.rootReplica.pageHeadingRange] ];

    this.rootBlock.rawString = this.rootReplica.rawString;

    if(EXTRACT_URL) {

            this.rootBlock.URL = ROOT.ownerDocument.location.href;
            this.rootBlock.baseURL = ROOT.baseURI;

    }

    this.json = JSON.stringify(this.rootBlock, ["from", "to", "mandatory", "style",
        "headings", "contents", "children", "rawString", "URL", "baseURL"], "  ");
    console.log("HEPS: Complete.");

};
