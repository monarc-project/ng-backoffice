(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbOpRiskCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'CategoryService', 'TagService', 'RiskService',
            BackofficeKbOpRiskCtrl
        ]);

    /**
     * BO > KB > OPERATIONAL RISKS (ROLF)
     */
    function BackofficeKbOpRiskCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                    CategoryService, TagService, RiskService) {
        TableHelperService.resetBookmarks();

        /**
         * CATEGORIES
         */
        $scope.categories = TableHelperService.build('label1', 10, 1, '');

        $scope.updateCategories = function () {
            $scope.categories.promise = CategoryService.getCategories($scope.categories.query);
            $scope.categories.promise.then(
                function (data) {
                    $scope.categories.items = data;
                }
            )
        };
        $scope.removeCategoriesFilter = function () {
            TableHelperService.removeFilter($scope.categories);
        };

        $scope.selectCategoriesTab = function () {
            TableHelperService.watchSearch($scope, 'categories.query.filter', $scope.categories.query, $scope.updateCategories, $scope.categories);
        };

        $scope.deselectCategoriesTab = function () {
            TableHelperService.unwatchSearch($scope.categories);
        };


        $scope.createNewCategory = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', CreateCategoryDialogCtrl],
                templateUrl: '/views/dialogs/create.categories.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (category) {
                    CategoryService.createCategory(category,
                        function () {
                            $scope.updateCategories();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The category has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editCategory = function (ev, category) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            CategoryService.getCategory(category.id).then(function (categoryData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'category', CreateCategoryDialogCtrl],
                    templateUrl: '/views/dialogs/create.categories.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'category': categoryData
                    }
                })
                    .then(function (category) {
                        CategoryService.updateCategory(category,
                            function () {
                                $scope.updateCategories();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The category has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.deleteCategory = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete category "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                CategoryService.deleteCategory(item.id,
                    function () {
                        $scope.updateCategories();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The category "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteCategoryMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected category(s)?',
                    {count: $scope.categories.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.categories.selected, function (value, key) {
                    CategoryService.deleteCategory(value.id,
                        function () {
                            $scope.updateCategories();
                        }
                    );
                });

                $scope.categories.selected = [];

            }, function() {
            });
        };


        /**
         * TAGS
         */
        $scope.tags = TableHelperService.build('label1', 10, 1, '');

        $scope.updateTags = function () {
            $scope.tags.promise = TagService.getTags($scope.tags.query);
            $scope.tags.promise.then(
                function (data) {
                    $scope.tags.items = data;
                }
            )
        };
        $scope.removeTagsFilter = function () {
            TableHelperService.removeFilter($scope.tags);
        };

        $scope.selectTagsTab = function () {
            TableHelperService.watchSearch($scope, 'tags.query.filter', $scope.tags.query, $scope.updateTags, $scope.tags);
        };

        $scope.deselectTagsTab = function () {
            TableHelperService.unwatchSearch($scope.tags);
        };

        $scope.createNewTag = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', CreateTagDialogCtrl],
                templateUrl: '/views/dialogs/create.tags.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (tag) {
                    TagService.createTag(tag,
                        function () {
                            $scope.updateTags();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The tag has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editTag = function (ev, tag) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            TagService.getTag(tag.id).then(function (tagData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'tag', CreateTagDialogCtrl],
                    templateUrl: '/views/dialogs/create.tags.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'tag': tagData
                    }
                })
                    .then(function (tag) {
                        TagService.updateTag(tag,
                            function () {
                                $scope.updateTags();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The tag has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.deleteTag = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete tag "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                TagService.deleteTag(item.id,
                    function () {
                        $scope.updateTags();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The tag "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteTagMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected tag(s)?',
                    {count: $scope.tags.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.tags.selected, function (value, key) {
                    TagService.deleteTag(value.id,
                        function () {
                            $scope.updateTags();
                        }
                    );
                });

                $scope.tags.selected = [];

            }, function() {
            });
        };


        /**
         * RISKS
         */
        $scope.risks = TableHelperService.build('label1', 10, 1, '');

        $scope.updateRisks = function () {
            $scope.risks.promise = RiskService.getRisks($scope.risks.query);
            $scope.risks.promise.then(
                function (data) {
                    $scope.risks.items = data;
                }
            )
        };
        $scope.removeRisksFilter = function () {
            TableHelperService.removeFilter($scope.risks);
        };

        $scope.selectRisksTab = function () {
            TableHelperService.watchSearch($scope, 'risks.query.filter', $scope.risks.query, $scope.updateRisks, $scope.risks);
        };

        $scope.deselectRisksTab = function () {
            TableHelperService.unwatchSearch($scope.risks);
        };

        $scope.createNewRisk = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ConfigService', 'CategoryService', 'TagService', CreateRiskDialogCtrl],
                templateUrl: '/views/dialogs/create.risks.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (risk) {
                    var riskCatIds = [];
                    var riskTagIds = [];

                    for (var i = 0; i < risk.categories.length; ++i) {
                        riskCatIds.push(risk.categories[i].id);
                    }

                    for (var i = 0; i < risk.tags.length; ++i) {
                        riskTagIds.push(risk.tags[i].id);
                    }

                    risk.categories = riskCatIds;
                    risk.tags = riskTagIds;

                    RiskService.createRisk(risk,
                        function () {
                            $scope.updateRisks();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The risk has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editRisk = function (ev, risk) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            RiskService.getRisk(risk.id).then(function (riskData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'ConfigService', 'CategoryService', 'TagService', 'risk', CreateRiskDialogCtrl],
                    templateUrl: '/views/dialogs/create.risks.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'risk': riskData
                    }
                })
                    .then(function (risk) {
                        var riskCatIds = [];
                        var riskTagIds = [];

                        for (var i = 0; i < risk.categories.length; ++i) {
                            riskCatIds.push(risk.categories[i].id);
                        }

                        for (var i = 0; i < risk.tags.length; ++i) {
                            riskTagIds.push(risk.tags[i].id);
                        }

                        risk.categories = riskCatIds;
                        risk.tags = riskTagIds;

                        RiskService.updateRisk(risk,
                            function () {
                                $scope.updateRisks();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The risk has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.deleteRisk = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete risk "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                RiskService.deleteRisk(item.id,
                    function () {
                        $scope.updateRisks();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The risk "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteRiskMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected risk(s)?',
                    {count: $scope.risks.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.risks.selected, function (value, key) {
                    RiskService.deleteRisk(value.id,
                        function () {
                            $scope.updateRisks();
                        }
                    );
                });

                $scope.risks.selected = [];

            }, function() {
            });
        };
    }

    function CreateCategoryDialogCtrl($scope, $mdDialog, ConfigService, category) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (category != undefined && category != null) {
            $scope.category = category;
        } else {
            $scope.category = {
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.category);
        };
    }

    function CreateTagDialogCtrl($scope, $mdDialog, ConfigService, tag) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (tag != undefined && tag != null) {
            $scope.tag = tag;
        } else {
            $scope.tag = {
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.tag);
        };
    }

    function CreateRiskDialogCtrl($scope, $mdDialog, $q, ConfigService, CategoryService, TagService, risk) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();


        $scope.categorySearchText = null;
        $scope.categorySelectedItem = null;
        $scope.queryCategorySearch = function (query) {
            var promise = $q.defer();
            CategoryService.getCategories({filter: query}).then(function (e) {
                promise.resolve(e.categories);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.tagSearchText = null;
        $scope.tagSelectedItem = null;
        $scope.queryTagSearch = function (query) {
            var promise = $q.defer();
            TagService.getTags({filter: query}).then(function (e) {
                promise.resolve(e.tags);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        if (risk != undefined && risk != null) {
            $scope.risk = risk;
        } else {
            $scope.risk = {
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
                categories: [],
                tags: [],
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.risk);
        };
    }
})();