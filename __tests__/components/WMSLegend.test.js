/* global afterEach, beforeEach, describe, it */

var React = require('react');
var ReactDOM = require('react-dom');
var assert = require('chai').assert;
var raf = require('raf');
raf.polyfill();
var ol = require('openlayers');
var parse = require('url-parse');

var WMSLegend = require('../../js/components/WMSLegend.jsx');

describe('WMSLegend', function() {
  var target, map, layer;
  var layerName = 'foo';
  var wmsHost = 'suite.boundlessgeo.com';
  var wmsPath = '/geoserver/wms';
  var wmsUrl = 'http://' + wmsHost + wmsPath;
  var width = 360;
  var height = 180;

  beforeEach(function(done) {
    target = document.createElement('div');
    var style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);
    layer = new ol.layer.Tile({
      source: new ol.source.TileWMS({
        url: wmsUrl,
        params: {
          LAYERS: layerName
        }
      })
    });
    map = new ol.Map({
      target: target,
      layers: [layer],
      view: new ol.View({
        center: [0, 0],
        zoom: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    map.setTarget(null);
    document.body.removeChild(target);
  });


  it('generates the correct legend url', function() {
    var container = document.createElement('div');
    ReactDOM.render((
      <WMSLegend layer={layer}/>
    ), container);
    var image = container.querySelector('img');
    var url = parse(image.getAttribute('src'), true);
    assert.equal(url.query.request, 'GetLegendGraphic');
    assert.equal(url.query.transparent, 'true');
    assert.equal(url.query.width, '20');
    assert.equal(url.query.height, '20');
    assert.equal(url.query.layer, layerName);
    assert.equal(url.query.legend_options, 'fontColor:0x000000;forceLabels:on;fontAntiAliasing:true;fontSize:11;fontName:Arial');
    assert.equal(url.query.format, 'image/png');
    assert.equal(url.pathname, wmsPath);
    assert.equal(url.host, wmsHost);
    ReactDOM.unmountComponentAtNode(container);
  });

});
