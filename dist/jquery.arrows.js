(function ($) {
    $.fn.arrow = function (options) {
        var opt = $.extend({
            destiny: false,
            from: 'default',
            to: 'default',
            fromOffset: {x: 0, y: 0},
            toOffset: {x: 0, y: 0},
            arc: 50,
            style: 'freehand',
            lineStyle: {
                stroke: '#ffffff',
                strokeWidth: '1px',
                fill: 'none'
            },
            spread: null,
            numLines: 3,
            arrowSize: null,
            arrowSpread: null,
            id: null,
            debug: false
        }, options);

//        console.log(opt);
        var o = this;
        var destiny = opt.destiny;

        // origin logic, check for type, existance, addPosInfo.
        if (!destiny) log('destiny is required');
        if (destiny instanceof jQuery) {
        } else if ($.type(destiny) === "string") {
            try {
                var newOrigin = $(destiny);
            } catch (error) {
//                log('origin is not a valid selector string.');
                return;
            }
            destiny = newOrigin;
//            log("origin set with selector string");
        } else {
//            log('origin must be either a jQuery object or a selector string');
            return;
        }
        if (destiny.length === 0) {
//            log('no DOM element in origin jQuery object');
        } else {
            var d = destiny;
            if (d.length > 1) {
//                log('multiple elements matched in origin jQuery object, using first one.');
//                log(o);
                d = d.eq(0);
            }
        }

        function log(message) {
            console.log(message);
            return true;
        }

        var canvas = createCanvas();
        drawArrows(canvas);
        styleArrows(canvas);
        positionArrows(canvas);


//        init();

        /**
         * Takes a DOM object and a corner offset, and returns the absolute x, y or x+y location of that point in the object.
         *
         * @param obj (DOM object)
         * @param corner (string corner or side)
         * @param xy (desired return coordinate(s))
         * @param offset (relative x,y offset coordinates passed by from/toOffset.
         * @returns x,y coordinate(s) {numeric / object {x: numeric, y: numeric)
         */
        function getPoint(obj, corner, xy, offset) {
            $.extend(obj, {
                x: obj.offset().left,
                y: obj.offset().top
            });
            var x = 0, y = 0;
            switch (corner) {
                case "top":
                    x = obj.x + obj.width() / 2;
                    y = obj.y;
                    break;
                case "right":
                    x = obj.x + obj.width();
                    y = obj.y + obj.height() / 2;
                    break;
                case "bottom":
                    x = obj.x + obj.width() / 2;
                    y = obj.y + obj.height();
                    break;
                case "left":
                    x = obj.x;
                    y = obj.y + obj.height() / 2;
                    break;
                case "tl":
                    x = obj.x;
                    y = obj.y;
                    break;
                case "tr":
                    x = obj.x + obj.width();
                    y = obj.y;
                    break;
                case "bl":
                    x = obj.x;
                    y = obj.y + obj.height();
                    break;
                case "br":
                    x = obj.x + obj.width();
                    y = obj.y + obj.height();
                    break;
                default:
                    x = obj.x + obj.width() / 2;
                    y = obj.y + obj.height() / 2;
                    break;
            }
            if (offset) {
                x += offset.x;
                y += offset.y;
            }
            //log('this is upsetting. oops, meant offsetting.');

            if (xy === 'x') return x;
            else if (xy === 'y') return y;
            else return {x: x, y: y};
        }

        /**
         * Takes two points (and a bunch of options) and calculates the midpoint, corner
         * adds random jitter if in freehand style
         *
         * @param start (object {x,y})
         * @param end  (object {x,y})
         * @returns {{start: {y: number, x: number}, pull: {y: number, x: number}, end: {y: number, x: number}, mid: {x: number, y: number}, dist: number}}
         */
        function createPathPoints(start, end) {
            var distance = Math.sqrt(Math.pow(Math.abs(start.x - end.x), 2) + Math.pow(Math.abs(start.y - end.y), 2));
            var angle = Math.atan2((end.y - start.y), (end.x - start.x));
            var pullAngle = angle + Math.PI / 2;
            var mid = {
                x: (start.x + end.x) / 2,
                y: (start.y + end.y) / 2
            };
            var pull = {
                y: mid.y + (Math.sin(pullAngle) * opt.arc),
                x: mid.x + (Math.cos(pullAngle) * opt.arc)
            };
//            console.log("pullpoint: ", pull);
            if (opt.style === 'freehand') {
                if (opt.spread == null) {
                    opt.spread = Math.sqrt(distance);
                }
                start.x += Math.random() * opt.spread - (opt.spread / 2);
                start.y += Math.random() * opt.spread - (opt.spread / 2);
                end.x += Math.random() * opt.spread - (opt.spread / 2);
                end.y += Math.random() * opt.spread - (opt.spread / 2);
                pull.x += Math.random() * opt.spread - (opt.spread / 2);
                pull.y += Math.random() * opt.spread - (opt.spread / 2);
            }
            return {start: start, pull: pull, end: end, mid: mid, dist: distance};
        }


        /**
         * Takes endpoints generated by createPathPoints() and generates an appropriate arrowhead.
         *
         * @param points
         * @returns {{start: {y: number, x: number}, end: {y: number, x: number}, pull: {y: *, x: *}}}
         */
        function createArrowHead(points) {
            if (!opt.arrowSize) opt.arrowSize = Math.sqrt(points.dist);
            var size = opt.arrowSize;
            var angle = Math.atan2((points.end.y - points.pull.y), (points.end.x - points.pull.x));
            var direction = Math.PI / 2 + angle;
            var arrowHeadPoints = {
                start: {
                    y: points.end.y + (Math.sin(direction) * size) - (Math.sin(angle) * size),
                    x: points.end.x + (Math.cos(direction) * size) - (Math.cos(angle) * size)
                },
                end: {
                    y: points.end.y - (Math.sin(direction) * size) - (Math.sin(angle) * size),
                    x: points.end.x - (Math.cos(direction) * size) - (Math.cos(angle) * size)
                },
                pull: {
                    y: points.end.y + 2 * (Math.sin(angle) * size),
                    x: points.end.x + 2 * (Math.cos(angle) * size)
                }
            };
            if (opt.style === 'freehand') {
                var spread = 0;
                if (opt.arrowSpread !== null) {
                    spread = opt.arrowSpread
                }
                else if (opt.spread !== null) {
                    spread = Math.sqrt(opt.spread)
                }
                else if (!points.distance !== null) {
                    spread = Math.pow(points.distance, 1 / 3)
                }
                arrowHeadPoints.start.x += Math.random() * spread - (spread / 2);
                arrowHeadPoints.start.y += Math.random() * spread - (spread / 2);
                arrowHeadPoints.end.x += Math.random() * spread - (spread / 2);
                arrowHeadPoints.end.y += Math.random() * spread - (spread / 2);
                arrowHeadPoints.pull.x += Math.random() * spread - (spread / 2);
                arrowHeadPoints.pull.y += Math.random() * spread - (spread / 2);
            }

            return arrowHeadPoints;
        }

        /**
         * takes pathpoints generated by createPathPoints() or createArrowHead() and generates a path string to be used in SVG.Snap.
         * (quadratic only for now)
         *
         * @param points
         * @returns {string}
         */
        function pathToString(points) {
            if (opt.style === 'freehand' || opt.style === 'smooth') {
                return "M" + points.start.x + ", " + points.start.y + " Q" + points.pull.x + ", " + points.pull.y + " " + points.end.x + ", " + points.end.y;
            } else {
                //TODO: other types.
                return "M" + points.start.x + ", " + points.start.y + " Q" + points.pull.x + ", " + points.pull.y + " " + points.end.x + ", " + points.end.y;
            }
        }

        /**
         * plot a point with the given size in radius.
         *
         * @param point  (x,y object)
         * @param size   (integer)
         * @param canvas (SVG canvas object)
         * @returns {SVG circle object}
         */
        function plot(point, size, canvas) {
            if (!size) var size = 2;
            if (point.x && point.y) {
                return canvas.circle(point.x, point.y, size);
            }
            return false;
        }

        /**
         * plot all points in the object
         * see plot()
         *
         * @param points
         * @param size
         * @param canvas (SVG canvas to draw to)
         */
        function plotAll(points, size, canvas) {
            for (var key in points) {
                plot(points[key], size, canvas);
            }
        }

        /**
         * Gets the relative position of point a from point b.
         *
         * @param a object {x,y}
         * @param b object {x,y}
         *
         * return: object {x,y}
         */
        function getRelPos(a, b) {
            return {
                x: a.x - b.x,
                y: a.y - b.y
            };
        }

        /**
         * Sets up a canvas with a given or default ID and returns it.
         *
         * @returns {SVG canvas/paper}
         */
        function createCanvas() {
            var svgID = $(this).attr('id') + "-arrow";
            if (opt.id) svgID = opt.id;
            o.append("<svg id='" + svgID + "'></svg>");
            return Snap("#" + svgID);
        }

        /**
         * takes cues from options and utilizes helper functions to get points of arrows, and draw the lines + heads
         *
         * @param canvas (SVG canvas to draw on)
         * @returns canvas (SVG canvas)
         */
        function drawArrows(canvas) {
            for (var i = 0, points = []; i < opt.numLines; i++) {
                points[i] = createPathPoints(getPoint(o, opt.from, '', opt.fromOffset), getPoint(d, opt.to, '', opt.toOffset));
                canvas.path(pathToString(points[i]));
                var head = createArrowHead(points[i]);
                canvas.path(pathToString(head));
                if (opt.debug) {
                    plot(getPoint(o, opt.from, '', opt.fromOffset), 2, canvas);
                    plot(getPoint(d, opt.to, '', opt.toOffset), 2, canvas);
                    plot(getPoint(o, "tl"), 2, canvas);
                    plot(getPoint(o, "tr"), 2, canvas);
                    plot(getPoint(o, "bl"), 2, canvas);
                    plot(getPoint(o, "br"), 2, canvas);
                    plot(getPoint(d, "tl"), 2, canvas);
                    plot(getPoint(d, "tr"), 2, canvas);
                    plot(getPoint(d, "bl"), 2, canvas);
                    plot(getPoint(d, "br"), 2, canvas);
                    canvas.circle(getPoint(o, opt.from, 'x'), getPoint(o, opt.from, 'y'), 5, canvas);
                    canvas.circle(getPoint(d, opt.to, 'x'), getPoint(d, opt.to, 'y'), 5, canvas);
                    plotAll(head, 1, canvas);
                    plotAll(points[i], 1, canvas);
                }
            }
            return canvas;
        }

        function styleArrows(canvas) {
            canvas.selectAll("path, line").attr(opt.lineStyle);
            return canvas;
        }

        /**
         * resizes the canvas from full-screen to it's bounding box
         * (bounding box depends on so many settings and random effects it easier to draw first, then resize the viewport)
         *
         * @param canvas (SVG canvas to resize and position
         * @returns {canvas}
         */
        function positionArrows(canvas) {
            var box = canvas.getBBox();
            var nudge = getRelPos(box, o);
            // if destiny has a psuedo element, nudge more. (Why do I have to do this?)
            // TODO: investigate.
//            if (window.getComputedStyle(o[0], 'before').content !== "") {
//                nudge.y -= o.height();
//            }
            if (opt.debug) {
                log("nudge; x: " + nudge.x + ", y: " + nudge.y);
                log("box; x: " + box.x + ", y: " + box.y);
                log("destiny; x: " + d.x + ", y: " + d.y);
                log("origin; x: " + o.x + ", y: " + o.y);
            }
            canvas.attr({
                viewBox: box.vb,
                width: box.width,
                height: box.height,
                style: "position: absolute;" +
                    " top: " + nudge.y + "px;" +
                    " left: " + nudge.x + "px;"
            });
            return canvas;
        }
    };
})
    (jQuery);
