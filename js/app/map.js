define([
    'OpenLayers/ol'
], function (
  ol
) {

  map = new ol.Map({
    target: 'map',
    view: new ol.View({
      center: [0, 0],
      zoom: 0
    })
  });

  function greyscale(context) {
    var canvas = context.canvas;
    var width = canvas.width;
    var height = canvas.height;
    var imgd = context.getImageData(0, 0, width, height);
    var pix = imgd.data;

    for (var i = 0, n = pix.length; i < n; i += 4) {
        seaness = pix[i + 2] - pix[i];
        forrestness = pix[i + 1] - pix[i];
        var intensity = pix[i]; //(3 * pix[i] + 4 * pix[i + 1] + pix[i + 2]) / 8;
        pix[i + 1] = pix[i + 2] = intensity;
        pix[i] = 153 + ((255 - 153) * intensity / 255);
        if (seaness >= 0) {
            seaness = Math.min(seaness, 64) / 64;
            pix[i] = pix[i] * (1 - seaness) + 64 * seaness;
            pix[i+1] = pix[i+1] * (1 - seaness) + 64 * seaness;
            pix[i+2] = pix[i+2] * (1 - seaness) + 64 * seaness;
        } else if (forrestness >= 0) {
            forrestness = Math.min(forrestness, 32) / 32;
            pix[i] = pix[i] * (1 - forrestness) + 220 * forrestness;
            pix[i+1] = pix[i+1] * (1 - forrestness) + 220 * forrestness;
            pix[i+2] = pix[i+2] * (1 - forrestness) + 220 * forrestness;
        }
    }
    context.putImageData(imgd,0,0);
  }

  tileLayer = new ol.layer.Tile({source: new ol.source.OSM()});
  tileLayer.on('postrender', function(event) {
    greyscale(event.context);
  });
  map.addLayer(tileLayer);

  return map;  
});
