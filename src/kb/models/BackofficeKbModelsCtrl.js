(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsCtrl', [
            '$scope', '$rootScope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'MetadataInstanceService', '$timeout',
            BackofficeKbModelsCtrl
        ]);

    /**
     * BO > KB > MODELS
     */
    function BackofficeKbModelsCtrl($scope, $rootScope, toastr, $mdMedia, $mdDialog, gettextCatalog, TableHelperService,
                                    ModelService, MetadataInstanceService, $timeout) {
        TableHelperService.resetBookmarks();

        $scope.models = TableHelperService.build($scope._langField('label'), 10, 1, '');

        $scope.updateModels = function () {
            $scope.models.promise = ModelService.getModels($scope.models.query);
            $scope.models.promise.then(
                function (data) {
                    $scope.models.items = data;
                }
            )
        };
        $scope.removeModelsFilter = function () {
            TableHelperService.removeFilter($scope.models);
            $scope.models.query.status = 'all';
        };

        TableHelperService.watchSearch($scope, 'models.query.filter', $scope.models.query, $scope.updateModels);

        TableHelperService.watchSearch($scope, 'models.query.status', $scope.models.query, $scope.updateModels);

        $scope.createNewModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$rootScope', '$mdDialog', '$mdMedia', 'gettextCatalog','ConfigService', 'MetadataInstanceService', 'model', CreateModelDialogCtrl],
                templateUrl: 'views/dialogs/create.models.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    model: model
                }
            })
                .then(function (model) {
                    ModelService.createModel(model,
                        function (response) {
                            $scope.updateModels();
                            ModelService.getModel(response.id).then(function(data) {
                                MetadataInstanceService.createMetadataField({anrId: data.anr.id, metadataField:model.metadataField},function(){},function(){})
                            })
                            toastr.success(gettextCatalog.getString('The model has been created successfully.',
                                {modelLabel: $scope._langField(model,'label')}), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewModel(ev, model);
                        }
                    );
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.editModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ModelService.getModel(model.id).then(function (modelData) {
                $mdDialog.show({
                    controller: ['$scope', '$rootScope', '$mdDialog', '$mdMedia', 'gettextCatalog', 'ConfigService', 'MetadataInstanceService','model', CreateModelDialogCtrl],
                    templateUrl: 'views/dialogs/create.models.html',
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'model': modelData
                    }
                })
                .then(function (model) {
                    ModelService.updateModel(model,
                        function () {
                            $scope.updateModels();
                            toastr.success(gettextCatalog.getString('The model has been edited successfully.',
                                {modelLabel: $scope._langField(model,'label')}), gettextCatalog.getString('Edition successful'));
                        },

                        function () {
                            $scope.editModel(ev, model);
                        }
                    );
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
            });
        };

        $scope.toggleModelStatus = function (item) {
            ModelService.patchModel(item.id, {'status': item.status ? 0 : 1}, function () {
                $scope.updateModels();
            });
        };

        $scope.deleteModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete model?',
                    {label: $scope._langField(item,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ModelService.deleteModel(item.id,
                    function () {
                        $scope.updateModels();
                        toastr.success(gettextCatalog.getString('The model has been deleted.',
                            {label: $scope._langField(item,'label')}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteModelMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected model(s)?',
                    {count: $scope.models.selected.length}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.models.selected, function (value, key) {
                    ModelService.deleteModel(value.id);
                });

                $timeout(function() { $scope.updateModels(); }, 500);
                toastr.success(gettextCatalog.getString('{{count}} models have been deleted.',
                    {count: $scope.models.selected.length}), gettextCatalog.getString('Deletion successful'));
                $scope.models.selected = [];

            }, function() {
            });
        };

        $scope.duplicateModel = function (item) {
            $scope.model_duplicating = true;
            ModelService.duplicateModel(item.id, function () {
                $scope.updateModels();
                $scope.model_duplicating = false;
                toastr.success(gettextCatalog.getString('The model has been duplicated sucessfully.',
                    {name: $scope._langField(item,'label')}), gettextCatalog.getString('Duplication successful'));
            });
        }
    }

    function CreateModelDialogCtrl($scope, $rootScope, $mdDialog, $mdMedia, gettextCatalog, ConfigService, MetadataInstanceService, model) {
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (model != undefined && model != null) {
            $scope.model = model;
            // Field is "isGeneric", but for UX reasons we display a "Specific" checkbox - invert the value here
            $scope.model.isGeneric = !$scope.model.isGeneric;
        } else {
            $scope.model = {
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
                isDefault: false,
                areScalesUpdatable: false,
                isGeneric: false,
                isRegulator: false,
                showRolfBrut: false,
            };
        }

        $scope.model.metadataFields = [];

        $scope.$watch('model.isRegulator', function (newValue) {
            if (newValue) {
                $scope.model.isGeneric = true; // Which is inverted (see UX note) - a Regulator model may NOT be Generic
            }
        })

        $scope.$watch('language', function (newValue) {
            if (newValue && $scope.model.id) {
                updateMetadataFields();
            }
        })

        $scope.newChip = function (chip, language) {
            newChip = {};
            for (language in $rootScope.languages) {
                newChip[$rootScope.languages[language].code] = chip ;
            }
            if ($scope.model.id) {
                MetadataInstanceService.createMetadataField({
                    anrId: $scope.model.anr.id,
                    metadataField: [newChip]},
                    function () {
                        updateMetadataFields()
                    }
                );
            } else {
                newChip['index'] = $scope.model.metadataFields.length + 1;
                $scope.model.metadataFields.push(angular.copy(newChip));
                return newChip;
            }
        }

        $scope.editMetadataField = function (ev, language, metadataField) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: editMetadataFieldsDialogCtrl,
                templateUrl: 'views/dialogs/edit.metadataField.html',
                targetEvent: ev,
                preserveScope: false,
                multiple: true,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                onRemoving : function(){
                    updateMetadataFields();
                },
                locals: {
                    model : $scope.model,
                }
            })

            function editMetadataFieldsDialogCtrl($scope, $mdDialog, model){
                $scope.language = language;
                $scope.metadataField = model.metadataFields[metadataField.index - 1];

                $scope.$watch('language', function (newValue) {
                    if (newValue && model.id) {
                        let language = $rootScope.getLanguageCode(newValue);
                        MetadataInstanceService.getMetadataField(
                            metadataField.id,
                            model.anr.id,
                            language
                        )
                        .then(function(data){
                            $scope.metadataField = data.data;
                        });
                    }
                })

                $scope.$watch(
                    'metadataField[$root.getLanguageCode(language)]',
                    function (newValue, oldValue) {
                        if (model.id && newValue && oldValue && newValue != oldValue) {
                            let language = $rootScope.getLanguageCode($scope.language);
                            MetadataInstanceService.updateMetadataFields(
                                model.anr.id,
                                {...$scope.metadataField, language:language}
                            )
                        }
                    }
                )

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
            }
        };

        $scope.deleteMetadataField = function (ev, index) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the context field?'))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .theme('light')
                .multiple(true)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                if ($scope.model.metadataFields[index].id && $scope.model.id) {
                    MetadataInstanceService.deleteMetadataField(
                        $scope.model.metadataFields[index].id,
                        $scope.model.anr.id,
                        updateMetadataFields()
                    );
                } else {
                    $scope.model.metadataFields.splice(index, 1);
                    $scope.model.metadataFields = angular.copy($scope.model.metadataFields);
                    $scope.model.metadataFields.forEach((metadataItem, i) => {
                        metadataItem.index = i + 1
                    });
                }
            });
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            if (!$scope.model.id) {
                $scope.model.metadataFields.forEach((metadataItem, i) => {
                    delete metadataItem.index;
                });
            } else {
                $scope.model.metadataFields = [];
            }
            // Field is "isGeneric", but for UX reasons we display a "Specific" checkbox - invert the value here
            $scope.model.isGeneric = !$scope.model.isGeneric;
            $mdDialog.hide($scope.model);
        };

        function updateMetadataFields() {
            let language = $rootScope.getLanguageCode($scope.language);
            MetadataInstanceService.getMetadataFields({
                anrId: $scope.model.anr.id,
                language: language
            })
            .then(function(data){
                $scope.model.metadataFields = data.data;
            });
        };
    }
})();
