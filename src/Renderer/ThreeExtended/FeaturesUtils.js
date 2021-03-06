function pointIsOverLine(point, linePoints, epsilon) {
    if (point.crs != linePoints[0].crs) {
        throw new Error('crs must be the same');
    }

    const x0 = point._values[0];
    const y0 = point._values[1];
    // for each segment of the line (j is i -1)
    for (var i = 1, j = 0; i < linePoints.length; j = i++) {
        /* **********************************************************
            norm     : norm of vector P1P2
            distance : distance point P0 to line P1P2
            scalar   : dot product of P1P0 and P1P2 divide by norm, it represents the projection of P0 on the line

            Point is over segment P1P2 if :
                * if the distance, , is inferior to epsilon
                * and if :  -epsilon ≤ scalar ≤ (||P1P2|| +  epsilon)

                            + (P0) _
                            |      |
                            |      |
             <---scalar---->|    distance
                            |      |
                            |      v
             +-------------------------------+
            (P1)                            (P2)
        *********************************************************** */

        const x1 = linePoints[i]._values[0];
        const y1 = linePoints[i]._values[1];
        const x2 = linePoints[j]._values[0];
        const y2 = linePoints[j]._values[1];

        const Xp = x0 - x1;
        const Yp = y0 - y1;

        const x21 = x2 - x1;
        const y21 = y2 - y1;
        const norm = Math.sqrt(x21 * x21 + y21 * y21);
        const scalar = (Xp * x21 + Yp * y21) / norm;

        if (scalar >= -epsilon && scalar <= norm + epsilon) {
            const distance = Math.abs(y21 * x0 - x21 * y0 + x2 * y1 - y2 * x1) / norm;
            if (distance <= epsilon) {
                return true;
            }
        }
    }

    return false;
}

function getClosestPoint(point, points, epsilon) {
    if (point.crs != points[0].crs) {
        throw new Error('crs must be the same');
    }

    const x0 = point._values[0];
    const y0 = point._values[1];
    let squaredEpsilon = epsilon * epsilon;
    let closestPoint;
    for (var i = 0; i < points.length; ++i) {
        const x1 = points[i]._values[0];
        const y1 = points[i]._values[1];
        const xP = x0 - x1;
        const yP = y0 - y1;
        const n = xP * xP + yP * yP;
        if (n < squaredEpsilon) {
            closestPoint = points[i];
            squaredEpsilon = n;
        }
    }
    return closestPoint;
}

function pointIsInsidePolygon(point, polygonPoints) {
    if (point.crs != polygonPoints[0].crs) {
        throw new Error('crs must be the same');
    }
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    const x = point._values[0];
    const y = point._values[1];

    let inside = false;
    // in first j is last point of polygon
    // for each segment of the polygon (j is i -1)
    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
        const xi = polygonPoints[i]._values[0];
        const yi = polygonPoints[i]._values[1];
        const xj = polygonPoints[j]._values[0];
        const yj = polygonPoints[j]._values[1];

        // isIntersect semi-infinite ray horizontally with polygon's edge
        const isIntersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (isIntersect) {
            inside = !inside;
        }
    }

    return inside;
}

function isFeatureSingleGeometryUnderCoordinate(coordinate, geometry, epsilon) {
    const coordinates = geometry.type == 'polygon' ?
        geometry.vertices.slice(geometry.contour.offset, geometry.contour.offset + geometry.contour.count) :
        geometry.vertices;

    if (geometry.type == 'linestring' && pointIsOverLine(coordinate, coordinates, epsilon)) {
        return true;
    } else if (geometry.type == 'polygon' && pointIsInsidePolygon(coordinate, coordinates)) {
        return true;
    } else if (geometry.type == 'point') {
        const closestPoint = getClosestPoint(coordinate, coordinates, epsilon);
        if (closestPoint) {
            return { coordinates: closestPoint };
        }
    }
}

function isFeatureUnderCoordinate(coordinate, feature, epsilon, result) {
    if (Array.isArray(feature.geometry)) {
        for (let i = 0; i < feature.geometry.length; i++) {
            const geometry = feature.geometry[i];
            const under = isFeatureSingleGeometryUnderCoordinate(coordinate, geometry, epsilon);
            if (under) {
                result.push({
                    feature,
                    coordinates: under.coordinates || geometry.vertices,
                });
            }
        }
    } else {
        const under = isFeatureSingleGeometryUnderCoordinate(coordinate, feature.geometry, epsilon);
        if (under) {
            result.push({
                feature,
                coordinates: under.coordinates || feature.geometry.vertices,
            });
        }
    }
}

export default {
    /**
     * filters the features that are under the coordinate
     *
     * @param      {Coordinates}  coordinate  the coordinate for the filter condition
     * @param      {Features}  features  features to filter
     * @param      {number}  epsilon  tolerance around the coordinate (in coordinate's unit)
     * @return     {array}  array of filters features
     */
    filterFeaturesUnderCoordinate(coordinate, features, epsilon = 0.1) {
        const result = [];
        if (Array.isArray(features)) {
            if (features.extent && !features.extent.isPointInside(coordinate, epsilon)) {
                return result;
            }
            for (const feature of features) {
                if (feature.extent && !feature.extent.isPointInside(coordinate, epsilon)) {
                    continue;
                }
                if (feature.geometry.extent && !feature.geometry.extent.isPointInside(coordinate, epsilon)) {
                    continue;
                }

                isFeatureUnderCoordinate(coordinate, feature, epsilon, result);
            }
        } else if (features.geometry) {
            if (features.geometry.extent && !features.geometry.extent.isPointInside(coordinate, epsilon)) {
                return result;
            }
            isFeatureUnderCoordinate(coordinate, features, epsilon, result);
        }
        return result;
    },
};
