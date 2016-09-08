'use strict';

(function () {

    angular
        .module('BackofficeApp')
        .factory('DownloadService', [ DownloadService ]);

    function DownloadService() {
        var self = this;

        var downloadBlob = function (data, name, typeF = 'octet/stream') {
            var saveData = (function () {
                var a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';

                return function (blobData, fileName,typeF = 'octet/stream') {
                    var blob = new Blob([blobData], {type: typeF}),
                        url = window.URL.createObjectURL(blob);

                    a.href = url;
                    a.download = fileName;
                    a.click();
                    window.URL.revokeObjectURL(url);
                };
            }());

            saveData(data, name,typeF);
        };

        return {
            downloadBlob: downloadBlob,
        };
    }

})();