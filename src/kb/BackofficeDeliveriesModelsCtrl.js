(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeDeliveriesModelsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$http', 'DownloadService', 'toastr', 'gettextCatalog', 'DeliveriesModelsService',
            'ConfigService', '$timeout',
            BackofficeDeliveriesModelsCtrl
        ]);

    /**
     * KB > Document Models Controller for the Backoffice module
     */
    function BackofficeDeliveriesModelsCtrl($scope, $mdDialog, $mdMedia, $http, DownloadService, toastr, gettextCatalog,
                                     DeliveriesModelsService) {
        $scope.deliveriesmodels = [];

        $scope.updateDeliveriesModels = function () {
            DeliveriesModelsService.getDeliveriesModels().then(function (data) {
                if (data.deliveriesmodels) {
                    $scope.deliveriesmodels = data.deliveriesmodels;
                }
            });
        }

        $scope.createNewDeliveryModel = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$rootScope', '$mdDialog', 'toastr', 'gettextCatalog', 'ConfigService', 'DeliveriesModelsService', 'Upload', CreateDeliveryModelDialogCtrl],
                templateUrl: 'views/dialogs/create.deliverymodel.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (deliveryModel) {
                    $scope.updateDeliveriesModels();
                    toastr.success(gettextCatalog.getString('The document has been created successfully.',
                        {deliveryModelLabel: $scope._langField(deliveryModel,'description')}), gettextCatalog.getString('Creation successful'));
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.editDeliveryModel = function (ev, deliverymodel) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$rootScope', '$mdDialog', 'toastr', 'gettextCatalog','ConfigService', 'DeliveriesModelsService', 'Upload', 'deliverymodel', CreateDeliveryModelDialogCtrl],
                templateUrl: 'views/dialogs/create.deliverymodel.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    deliverymodel: deliverymodel
                }
            })
                .then(function (deliveryModel) {
                    $scope.updateDeliveriesModels();
                    toastr.success(gettextCatalog.getString('The document has been edited successfully.',
                        {deliveryModelLabel: $scope._langField(deliveryModel,'description')}), gettextCatalog.getString('Edition successful'));
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.deleteDeliveryModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete document?',
                    {label: $scope._langField(item,'description')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                DeliveriesModelsService.deleteDeliveryModel(item.id,
                    function () {
                        $scope.updateDeliveriesModels();
                        toastr.success(gettextCatalog.getString('The document has been deleted.',
                            {label: $scope._langField(item,'description')}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.isPresentModel = function (item, lang) {
          if (item['path' + lang] && item['path' + lang]!="null") {
            return true;
          }else {
            return false;
          }
        }

        $scope.downloadDeliveryModel = function (item, lang) {
            if (item['path' + lang]) {
                $http.get(item['path' + lang], {responseType: 'arraybuffer'}).then(function (data) {
                    var contentD = data.headers('Content-Disposition'),
                        contentT = data.headers('Content-Type');
                    contentD = contentD.substring(0, contentD.length - 1).split('filename="');
                    contentD = contentD[contentD.length - 1];
                    DownloadService.downloadBlob(data.data, contentD, contentT);
                });
            } else {
                toastr.warning(gettextCatalog.getString("There is no document template of this category for this language."));
            }

        }

        $scope.getCategoryLabel = function (id) {
            return DeliveriesModelsService.getCategoryLabel(id);
        };
    }

    function CreateDeliveryModelDialogCtrl($scope, $rootScope, $mdDialog, toastr, gettextCatalog, ConfigService, DeliveriesModelsService, Upload, deliverymodel) {
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (deliverymodel) {
            $scope.deliveryModel = deliverymodel;
            $scope.deliveryModel.editable = deliverymodel.editable ? 1: 0;
            for (var i = 1; i <= 4; ++i) {
                if ($scope.deliveryModel['description' + i] == null) {
                    $scope.deliveryModel['description' + i] = undefined;
                }
            }
        } else {
            $scope.deliveryModel = {
                category: null,
                editable: 1
                // description: ''
            };
        }

        if (!$scope.deliveryModel.id) {
            // Hide categories which already have an item
            DeliveriesModelsService.getDeliveriesModels().then(function (existing_deliveriesmodels) {
                var all_categories = DeliveriesModelsService.getCategories();
                $scope.categories = [];

                for (var i = 0; i < all_categories.length; ++i) {
                    var found = false;

                    if (existing_deliveriesmodels.deliveriesmodels) {
                        for (var j = 0; j < existing_deliveriesmodels.deliveriesmodels.length; ++j) {
                            if (existing_deliveriesmodels.deliveriesmodels[j].category == all_categories[i].id) {
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) {
                        $scope.categories.push(all_categories[i]);
                    }
                }
            });
        } else {
            $scope.categories = DeliveriesModelsService.getCategories();
        }


        $scope.range = function (min, max) {
            var ret = [];
            for (var i = min; i <= max; ++i) {
                ret.push(i);
            }
            return ret;
        }

        $scope.uploadProgress = null;
        $scope.file = {};

        // Upload system
        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            var hasErrors = false;
            var hasFiles = false;

            for (var i = 1; i <= 4; ++i) {
                if ($scope.file[i]) {
                    hasFiles = true;

                    if ($scope.file[i].$error) {
                        hasErrors = true;
                        break;
                    }

                    if ($scope.deliveryModel['description' + i] == undefined) {
                        hasErrors = true;
                        toastr.error($scope.file.$error, gettextCatalog.getString('Missing description for ') + $rootScope.languages[i].name);
                        break;
                    }
                }
            }

            if (hasFiles && !hasErrors) {
                $scope.uploadProgress = 0;

                var performUpload = function () {

                    Upload.upload({
                        url: $scope.deliveryModel.id ? 'api/deliveriesmodels/' + $scope.deliveryModel.id : 'api/deliveriesmodels',
                        method: 'POST',
                        file: $scope.file,
                        data: $scope.deliveryModel
                    }).then(function (resp) {
                        $scope.uploadProgress = null;
                        if (resp.status == 200) {
                            $mdDialog.hide($scope.deliveryModel);
                        }
                    }, function (resp) {
                        toastr.error(gettextCatalog.getString('The server returned the error code:') + ' ' + resp.status, gettextCatalog.getString('Error while uploading'))
                    }, function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.uploadProgress = progressPercentage;
                    })
                }

                if ($scope.deliveryModel.id) {
                    DeliveriesModelsService.deleteDeliveryModel($scope.deliveryModel.id, function () {
                        $scope.deliveryModel.id = undefined;
                        $scope.deliveryModel.anr = undefined;
                        performUpload();
                    });
                } else {
                    performUpload();
                }

            } else if (hasFiles && hasErrors) {
                toastr.error($scope.file.$error, gettextCatalog.getString('File error'));
            } else if ($scope.deliveryModel.id > 0) {
                DeliveriesModelsService.updateDeliveryModel($scope.deliveryModel, function () {
                    $mdDialog.hide($scope.deliveryModel);
                }, function () {

                });
            } else {
                toastr.warning(gettextCatalog.getString('You must select a file'));
            }
        };
    }

})();
