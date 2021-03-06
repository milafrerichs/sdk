/*
 * Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import {doGET, getTimeInfo} from '../util.js';
import URL from 'url-parse';
import ol from 'openlayers';
import SLDService from './SLDService';

const wmsCapsFormat = new ol.format.WMSCapabilities();
const wmsGetFeatureInfoFormats = {
  'application/json': new ol.format.GeoJSON(),
  'application/vnd.ogc.gml': new ol.format.WMSGetFeatureInfo()
};

class WMSService {
  getCapabilities(url, onSuccess, onFailure) {
    var urlObj = new URL(url);
    urlObj.set('query', {
      service: 'WMS',
      request: 'GetCapabilities',
      version: '1.3.0'
    });
    return doGET(urlObj.toString(), function(xmlhttp) {
      var info = wmsCapsFormat.read(xmlhttp.responseText);
      onSuccess.call(this, info.Capability.Layer);
    }, function(xmlhttp) {
      onFailure.call(this, xmlhttp);
    }, this);
  }
  createLayer(layer, url, titleObj) {
    var getLegendUrl = function(layer) {
      if (layer.Style && layer.Style.length === 1) {
        if (layer.Style[0].LegendURL && layer.Style[0].LegendURL.length >= 1) {
          return layer.Style[0].LegendURL[0].OnlineResource;
        }
      }
    };
    return new ol.layer.Tile({
      title: titleObj.title,
      emptyTitle: titleObj.empty,
      id: layer.Name,
      name: layer.Name,
      legendUrl: getLegendUrl(layer),
      isRemovable: true,
      isSelectable: true,
      isWFST: true,
      timeInfo: getTimeInfo(layer),
      type: layer.Layer ? 'base' : undefined,
      EX_GeographicBoundingBox: layer.EX_GeographicBoundingBox,
      popupInfo: '#AllAttributes',
      source: new ol.source.TileWMS({
        url: url,
        wrapX: layer.Layer ? true : false,
        params: {
          LAYERS: layer.Name
        },
        serverType: 'geoserver'
      })
    });
  }
  getStyles(url, layer, onSuccess, onFailure) {
    var urlObj = new URL(url);
    urlObj.set('query', {
      service: 'WMS',
      request: 'GetStyles',
      layers: layer.get('name'),
      version: '1.1.1'
    });
    return doGET(urlObj.toString(), function(xmlhttp) {
      var info = SLDService.parse(xmlhttp.responseText);
      onSuccess.call(this, info);
    }, function(xmlhttp) {
      onFailure.call(this, xmlhttp);
    }, this);
  }
  getFeatureInfo(layer, coordinate, view, infoFormat, onSuccess) {
    var resolution = view.getResolution(), projection = view.getProjection();
    var url = layer.getSource().getGetFeatureInfoUrl(
      coordinate,
      resolution,
      projection, {
        'INFO_FORMAT': infoFormat
      }
    );
    doGET(url, function(response) {
      var result = {};
      if (infoFormat === 'text/plain' || infoFormat === 'text/html') {
        if (response.responseText.trim() !== 'no features were found') {
          result.text = response.responseText;
        } else {
          result = false;
        }
      } else {
        result.features = wmsGetFeatureInfoFormats[infoFormat].readFeatures(response.responseText);
      }
      result.layer = layer;
      onSuccess.call(this, result);
    });
  }
}

export default new WMSService();
