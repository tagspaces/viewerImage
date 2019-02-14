/* Copyright (c) 2013-present The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */
/* globals initI18N, getParameterByName, $, isWeb, isCordova, Viewer, EXIF, Nanobar, jQuery, Tiff */

'use strict';

$(document).ready(() => {
  let filePath = getParameterByName('file'); // TODO check decodeURIComponent loading fileswith#inthe.name
  const locale = getParameterByName('locale');
  initI18N(locale, 'ns.viewerImage.json');

  if (isCordova || isWeb) {
    // Cordova or web case
  } else {
    filePath = 'file://' + filePath;
  }

  const $imgViewer = $('#imageContainer');
  let exifObj;

  let extSettings;
  let imageBackgroundColor = '#000000';
  loadExtSettings();

  if (extSettings && extSettings.imageBackgroundColor) {
    imageBackgroundColor = extSettings.imageBackgroundColor;
  }

  // save settings for viewerSettings
  function saveExtSettings() {
    const settings = {
      imageBackgroundColor
    };
    localStorage.setItem('imageViewerSettings', JSON.stringify(settings));
    console.debug(settings);
  }

  // load settings for viewerSettings
  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem('imageViewerSettings'));
  }

  const opt = {
    // url: filePath,
    movable: true,
    navbar: false,
    toolbar: false,
    title: false,
    transition: false,
    fullscreen: true,
    inline: 'inline',
    // fading: true,
    hide: (e) => {
      console.log(e.type);
    }
  };
  let viewer;

  if (filePath.endsWith('.tiff') || filePath.endsWith('.tiff')) {
    $.getScript('libs/tiff.js/tiff.min.js', () => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'arraybuffer';
      xhr.open('GET', filePath);
      xhr.onload = () => {
        const tiff = new Tiff({ buffer: xhr.response });
        const canvas = tiff.toCanvas();
        $('#imageContent').attr('src', canvas.toDataURL());
      };
      xhr.send();
    });
  } else if (filePath.endsWith('.psd')) {
    $.getScript('libs/psd/dist/psd.min.js', () => {
      const PSD = require('psd');
      PSD.fromURL(filePath).then((psd) => {
        const image = psd.image.toPng();
        $('#imageContent').attr('src', image.getAttribute('src'));
        return true;
      }).catch(() => console.warn('Error loading PSD'));
    });
  } else {
    $('#imageContent').attr('src', filePath);
  }

  $('#imageContent').bind('load', (event) => {
    viewer = new Viewer(document.getElementById('imageContent'), opt);
    viewer.full();

    const $imageContentViewer = $('#imageContent');
    const eTarget = event.target;
    imageViewerContainer[0].style.background = imageBackgroundColor;
    $imageContentViewer.addClass('transparentImageBackground');
    $imgViewer.addClass('imgViewer');
    if (filePath.toLowerCase().indexOf('jpg') === (filePath.length - 3) ||
      filePath.toLowerCase().indexOf('jpeg') === (filePath.length - 4)) {
      EXIF.getData(eTarget, () => {
        const orientation = EXIF.getTag(eTarget, 'Orientation');
        correctOrientation(orientation);
        // console.log(EXIF.pretty(this));
        exifObj = {};
        const tags = ['Make', 'Model', 'DateTime', 'Artist', 'Copyright', 'ExposureTime ', 'FNumber', 'ISOSpeedRatings', 'ShutterSpeedValue', 'ApertureValue', 'FocalLength'];
        for (let tag in tags) {
          const prop = tags[tag];
          if (eTarget.exifdata.hasOwnProperty(prop)) {
            exifObj[prop] = eTarget.exifdata[prop];
          }
        }
        jQuery.extend(exifObj, eTarget.iptcdata);
        if (!jQuery.isEmptyObject(exifObj)) {
          $('#exifButton').parent().show();
          printEXIF();
        }
      });
    }
  });

  $('#imageContent').css('visibility', 'hidden');

  const offset = 0;
  $('#zoomInButton').on('click', (e) => {
    e.stopPropagation();
    viewer.zoom(offset + 1);
  });

  $('#zoomOutButton').on('click', (e) => {
    e.stopPropagation();
    viewer.zoom(offset - 1);
  });

  $('#zoomResetButton').on('click', () => {
    viewer.zoomTo(1);
  });

  $('#fitToScreen').on('click', () => {
    viewer.reset();
  });

  $('#rotateLeftButton').on('click', (e) => {
    e.stopPropagation();
    viewer.rotate(-90);
  });

  $('#rotateRightButton').on('click', (e) => {
    e.stopPropagation();
    viewer.rotate(90);
  });

  let flipHorizontal;
  let flipVertical;
  let flipBoth;
  let flipColor;
  $('#flipHorizontal').on('click', (e) => {
    e.stopPropagation();
    if (flipHorizontal === true) {
      flipHorizontal = false;
      viewer.scaleX(1); // Flip horizontal
    } else {
      flipHorizontal = true;
      viewer.scaleX(-1); // Flip horizontal
    }
  });

  $('#flipVertical').on('click', (e) => {
    e.stopPropagation();
    if (flipVertical === true) {
      flipVertical = false;
      viewer.scaleY(1); // Flip horizontal
    } else {
      flipVertical = true;
      viewer.scaleY(-1); // Flip vertical
    }
  });

  $('#flipBoth').on('click', (e) => {
    e.stopPropagation();
    if (flipBoth === true) {
      flipBoth = false;
      viewer.scale(1); // Flip horizontal
    } else {
      flipBoth = true;
      viewer.scale(-1); // Flip both horizontal and vertical
    }
  });

  const imageViewerContainer = document.getElementsByClassName('viewer-container');

  $('#whiteBackgroundColor').on('click', (e) => {
    e.stopPropagation();
    document.body.style.background = '#ffffff';
    imageViewerContainer[0].style.background = '#ffffff';
    imageBackgroundColor = '#ffffff';
    saveExtSettings();
  });

  $('#blackBackgroundColor').on('click', (e) => {
    e.stopPropagation();
    document.body.style.background = '#000000';
    imageViewerContainer[0].style.background = '#000000';
    imageBackgroundColor = '#000000';
    saveExtSettings();
  });

  $('#sepiaBackgroundColor').on('click', (e) => {
    e.stopPropagation();
    document.body.style.background = '#f4ecd8';
    imageViewerContainer[0].style.background = '#f4ecd8';
    imageBackgroundColor = '#f4ecd8';
    saveExtSettings();
  });

  $('#flipBlackAndWhiteColor').on('click', (e) => {
    e.stopPropagation();
    if (flipColor) {
      flipColor = false;
      imageViewerContainer[0].style.filter = 'grayscale(0%)';
      imageViewerContainer[0].style.WebkitFilter = 'grayscale(0%)';
    } else {
      flipColor = true;
      imageViewerContainer[0].style.filter = 'grayscale(100%)';
      imageViewerContainer[0].style.WebkitFilter = 'grayscale(100%)';
    }
  });

  function printEXIF() {
    const $exifRow = $('#exifRow').clone(); // Preparing the template
    const $exifTableBody = $('#exifTableBody');
    $exifTableBody.empty();
    for (let key in exifObj) {
      if (exifObj.hasOwnProperty(key) && exifObj[key].length !== 0) {
        $exifRow.find('th').text(key);
        $exifRow.find('td').text(exifObj[key]);
        $exifTableBody.append($exifRow.clone());
      }
    }
  }

  function correctOrientation(orientation) {
    switch (orientation) {
      case 8:
        viewer.rotate(-90);
        break;
      case 3:
        viewer.rotate(180);
        break;
      case 6:
        viewer.rotate(90);
        break;
      case 1:
        viewer.rotate(0);
        break;
      default:
        viewer.rotate(0);
    }
  }

  // if (isCordova) {
  //  $('#printButton').hide();
  // }

  // Nano progressbar
  $(() => {
    const options = {
      bg: '#42BEDB', // (optional) background css property, '#000' by default
      // leave target blank for global nanobar
      target: document.getElementById('nanoBar'), // (optional) Where to put the progress bar, nanobar will be fixed to top of document if target is null
      // id for new nanobar
      id: 'nanoBar' // (optional) id for nanobar div
    };
    const nanobar = new Nanobar(options);
    let pct = 0;
    $(document).ajaxSend(() => {
      pct += 0.1;
      // move bar
      nanobar.go(pct);
      if (pct > 100.0) {
        pct = 0.0;
      }
    }).ajaxComplete(() => {
      nanobar.go(100);
    });
  });
});
