// var findLinearCoef = require('./findLinearCoef');
// var findOrientation = require('./findOrientation');
// var squareCircleSystem = require('./squareCircleSystem');
// var triangleSystem = require('./triangleSystem');
// var findSquareRoots = require('./findSquareRoots');

// require('./js/squareCircleSystem.js');
// require('./js/triangleSystem.js');
// require('./js/findOrientation.js');
// require('./js/findSquareRoots.js');

// var COEF = 1.337972467;
// var COEF = 794;

var osm = L.tileLayer(
    // standart osm
    'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
    // relief map
    // 'http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }),
    map = new L.Map('map', {layers: [osm], center: new L.LatLng(55.86531828981331, 37.630534172058105), zoom: 16, maxZoom: 22}),
    moscow = L.latLng(37, 55);

L.control.scale().addTo(map);

var circlesCentersOptions = {
    weight: 1,
    radius: 3,
    color: 'black',
    fill: true,
    fillColor: 'blue',
    fillOpacity: 0.8
};

var upperPointsOptions = {
    weight: 1,
    radius: 3,
    color: 'black',
    fill: true,
    fillColor: 'yellow',
    fillOpacity: 0.8
};

var rightPointsOptions = {
    weight: 1,
    radius: 3,
    color: 'black',
    fill: true,
    fillColor: 'green',
    fillOpacity: 0.8
};

var coordinates = medvedkovo;
var coordinates = los;
var coordinates = mongolia;
// var coordinates = world;

coordinates.forEach(function(ll){
    return ll.reverse();
});

var polygonLL = [];
// test polyline
var testRiver = L.polyline(coordinates, {color: 'blue', weight: 1, smooth: 3});
testRiver.addTo(map);

map.fitBounds(testRiver.getBounds());
// map.setZoom(14);
var startPoint = testRiver.getLatLngs()[0];

polygonLL.push(
    {id: 0, latLng: startPoint}
)

var widthRange = {
    startWidth: 0,
    endWidth: 1000
};

L.setOptions(testRiver, {
    points: setPoints(testRiver)
})

function setPoints(polyline) {
    var latLngs = polyline.getLatLngs(),
        points = [];

    for (var i = 0; i < latLngs.length; i++) {
        points.push({
            id: i,
            lat: latLngs[i].lat,
            lng: latLngs[i].lng,
            _map: map,
            _latlng: L.latLng(latLngs[i].lat, latLngs[i].lng),
            _point: null,
            _radius: null,
            _radiusY: null,
            projected: map.options.crs.project(latLngs[i]/*, map.getZoom()*/),
            x: null,
            y: null,
            milestone: null,
            percent: null,
            _mRadius: null,
            x: null,
            y: null,
            ll1: null,
            ll2: null,
            ll3: null,
            ll4: null
        });
    }

    return points;
}

/**
 * API
 */

// counting milestones in meters on every vertex on polyline
function countMileStones(polyline) {
    var points = polyline.options.points,
        totalLength = points[0].milestone = 0;

    for (var i = 0; i < points.length - 1; i++) {
        var length = map.distance(points[i]._latlng, points[i+1]._latlng);

        totalLength += length;
        points[i+1].milestone = totalLength;
    }
    return points;
}

// count percentage
function countPercentage(points) {
    var totalLength = points[points.length-1].milestone;

    points.forEach(function(point){
        point.percent = point.milestone / totalLength;
    });

    return points;
}

// interpolate range
function interpolateRange(points, range) {
    var interval = range.endWidth - range.startWidth;

    for (var i = 0; i < points.length; i++) {
        points[i]._mRadius = range.startWidth + points[i].percent * interval;
    }

    return points;
}

// draw end circles
function drawEndCircles(points) {
    for (var i = 1; i < points.length; i++) {
        var circle = L.circle(points[i]._latlng, {radius: points[i]._mRadius, color: 'red'}).bindPopup('id: ' + i).addTo(map);
    }
    return points;
}

// line equation
function getLineAndEndCircleIntersections(points) {
    var firstLinePoints, secondLinePoints;

    for (var i = 0; i < points.length - 1; i++) {
        firstLinePoints = findLineCircleIntersection(points[i], points[i+1], points[i+1]);
        secondLinePoints = i === points.length - 2 ? findLineCircleIntersection(points[i], points[i+1], points[i+1]) : findLineCircleIntersection(points[i+1], points[i+2], points[i+1]);

        var limits1 = [points[i].projected, points[i+1].projected],
            limits2 = i === points.length - 2 ? limits1 : [points[i+1].projected, points[i+2].projected];
// debugger;
        var firstLineFiltered = filterPoints(firstLinePoints, limits1),
            secondLineFiltered = filterPoints(secondLinePoints, limits2);

        // console.log(firstLineFiltered);
        // console.log(secondLineFiltered);

        points[i+1].circleCenter1 = L.point(firstLineFiltered[0]);
        points[i+1].circleCenter2 = L.point(secondLineFiltered[0]);
        if (!points[i+1].circleCenter1 || !points[i+1].circleCenter2) {debugger;}
        // points[i+1].circleCenter3 = L.point(secondLineFiltered[0]);
        // points[i+1].circleCenter4 = L.point(secondLineFiltered[1]);

        points[i+1].ll1 = map.options.crs.unproject(points[i+1].circleCenter1);
        points[i+1].ll2 = map.options.crs.unproject(points[i+1].circleCenter2);
        // points[i+1].ll3 = map.options.crs.unproject(points[i+1].circleCenter3);
        // points[i+1].ll4 = map.options.crs.unproject(points[i+1].circleCenter4);



        L.circleMarker(points[i+1].ll1, circlesCentersOptions).addTo(map);
        L.circleMarker(points[i+1].ll2, upperPointsOptions).addTo(map);
        // L.circleMarker(points[i+1].ll3, upperPointsOptions).addTo(map);
        // L.circleMarker(points[i+1].ll4, upperPointsOptions).addTo(map);


        function filterPoints(points, limits) {
            var x1 = Math.min(limits[0].x, limits[1].x),
                y1 = Math.min(limits[0].y, limits[1].y),
                x2 = Math.max(limits[0].x, limits[1].x),
                y2 = Math.max(limits[0].y, limits[1].y);

            return points.filter(function(point){
                return point[0] >= x1 && point[0] <= x2 && point[1] >= y1 && point[1] <= y2;
            })
        }

    }
    return points;
}

// draw big circles
function drawBigCircles(points) {
    for (var i = 1; i < points.length; i++) {
        var radius = map.distance(points[i].ll1, points[i].ll2),
            radius1 = map.distance(points[i].ll1, points[i]._latlng),
            radius2 = map.distance(points[i].ll2, points[i]._latlng);
        var lat = points[i].lat;
        // console.log(i + '   ' + ( ((radius1) / Math.cos((Math.PI*lat)/180)) / (points[i]._mRadius)) + '  ' + Math.cos((Math.PI*lat)/180));
        points[i].radius = radius;
    }
    return points;
}

// circles intersection
function getTwoCirclesIntersection(points) {
    var center,
        x1,
        y1,
        x2,
        y2,
        radius,
        squareParams,
        roots,
        res1 = {
            x: null,
            y: null
        },
        res2 = {
            x: null,
            y: null
        }

    for (var i = 1; i < points.length; i++) {
        // debugger;
        center1 = points[i].circleCenter1;
        center2 = points[i].circleCenter2;
        x1 = points[i].projected.x;
        y1 = points[i].projected.y;
        x2 = center1.x;
        y2 = center1.y;
        a = x2 - x1;
        b = y2 - y1;
        radius = points[i].radius / Math.cos((Math.PI*points[i].lat)/180);
        squareParams = triangleSystem(points[i].projected, center1, radius);
        roots = findSquareRoots(squareParams);

        // edge cases
        if ((center1.x === center2.x && center1.y === center2.y) || !roots) {
            res1.x = x2;
            res1.y = y2;
            res2.x = x2;
            res2.y = y2;
        } else {
            res1.x = roots[0];
            res1.y = (-a * (roots[0] - x1) / b) + y1;
            res2.x = roots[1];
            res2.y = (-a * (roots[1] - x1) / b) + y1;
        }

        points[i].upperPoint1 = L.point(res1.x, res1.y);
        points[i].upperPoint2 = L.point(res2.x, res2.y);
        // L.circleMarker(map.options.crs.unproject(points[i].upperPoint1), upperPointsOptions).addTo(map);
        // L.circleMarker(map.options.crs.unproject(points[i].upperPoint2), upperPointsOptions).addTo(map);
        // L.polyline([points[i].upperPoint1, points[i].upperPoint2], {color: 'red', weight: 0.8}).addTo(map);
    }
    return points;
}

// getPoints
function getRightPoints(points) {
    var first, second,
        linearParams,
        a, b, c,
        x2, y2,
        r,
        lr, // left or right
        squareParams,
        roots,
        res1 = {
            x: null,
            y: null
        },
        res2 = {
            x: null,
            y: null
        }

    for (var i = 1; i < points.length; i++) {
        first = points[i].upperPoint1;
        second = points[i].upperPoint2;
        linearParams = findLinearCoef(first, second);
        a = linearParams.a;
        b = linearParams.b;
        c = linearParams.c;
        x2 = points[i].projected.x;
        y2 = points[i].projected.y;
        r = points[i]._mRadius / Math.cos((Math.PI*points[i].lat)/180);
        squareParams = squareCircleSystem(linearParams, points[i].projected, r);
        roots = findSquareRoots(squareParams);

        // edge case
        if (!roots) {
            res1.x = x2;
            res1.y = y2;
            res2.x = x2;
            res2.y = y2;
        } else {
            if (!a) {
                res1.x = x2 - r;
                res1.y = y2;
                res2.x = x2 + r;
                res2.y = y2;
            } else if (!b) {
                res1.x = x2;
                res1.y = y2 - r;
                res2.x = x2;
                res2.y = y2 + r;
            } else {
                res1.x = roots[0];
                res1.y = (-c - a * roots[0]) / b;
                res2.x = roots[1];
                res2.y = (-c - a * roots[1]) / b;
            }
        }

        // каждая следующая точка не может повторять себя
        // a и b не могут быть равны 0 одновременно


        lr = findOrientation(points[i-1].projected, points[i].projected, res1);

        if (lr) {
            var temp = res1;

            res1 = res2;
            res2 = temp;
        }

        var j = points.length - 1 + points.length - i;
        var one = L.point(res1.x, res1.y),
            two = L.point(res2.x, res2.y);

        var llone = map.options.crs.unproject(one),
            lltwo = map.options.crs.unproject(two);

        L.polyline([llone, lltwo], {color: 'red', weight: 0.8}).addTo(map);

        // L.circleMarker(llone, rightPointsOptions).bindPopup('id: ' + i + ' lr: ' + lr).addTo(map);
        // L.circleMarker(lltwo, rightPointsOptions).bindPopup('id: ' + j).addTo(map);

        var _mRadius = points[i]._mRadius,
            centersDistance = map.distance(points[i].ll1, points[i].ll2),
            // centersDistance2 = map.distance(map.unproject([points[i].circleCenter1.x, points[i].circleCenter1.y]), map.unproject([points[i].circleCenter2.x, points[i].circleCenter2.y])),
            distance = map.distance(map.unproject([res1.x, res1.y]), map.unproject([res2.x, res2.y]));

        // console.log(i + ' / ' + j);

        polygonLL.push(
            {id: i, latLng: llone},
            {id: j, latLng: lltwo}
        )
    }
    return points;

}

var mileStoned = countMileStones(testRiver),
    percentaged = countPercentage(mileStoned),
    interpolated = interpolateRange(percentaged, widthRange),
    circled = drawEndCircles(interpolated),
    lineEqCalculated = getLineAndEndCircleIntersections(circled),
    bigCircled = drawBigCircles(lineEqCalculated),
    twoCirclesCalculated = getTwoCirclesIntersection(bigCircled),
    right = getRightPoints(twoCirclesCalculated);

// polygonLL.push(
//     {id: polygonLL.length, latLng: startPoint}
// )

polygonLL.sort(function(a, b){
    return a.id - b.id;
});



var plg = polygonLL.map(function(obj){
    return obj.latLng;
});
// simple
L.polygon(plg, {weight: 1, fillOpacity: 0.5}).addTo(map);
// beautyfied
// L.polygon(plg, {color: '#8086fc', weight: 1, fillColor: '#97d2e3', fillOpacity: 1}).addTo(map);
// var testRiver = L.polyline(coordinates, {color: 'red', weight: 1}).addTo(map);
