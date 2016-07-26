'use strict';

(function () {

    angular
        .module('BackofficeApp')
        .factory('DownloadService', [ DownloadService ]);

    function DownloadService() {
        var self = this;

        var downloadBlob = function (data, name) {
            var saveData = (function () {
                var a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';

                return function (blobData, fileName) {
                    var blob = new Blob([blobData], {type: 'octet/stream'}),
                        url = window.URL.createObjectURL(blob);

                    a.href = url;
                    a.download = fileName;
                    a.click();
                    window.URL.revokeObjectURL(url);
                };
            }());

            saveData(data, name);
        };

        return {
            downloadBlob: downloadBlob,
        };
    }

})();