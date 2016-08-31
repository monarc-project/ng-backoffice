(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbOpRiskCtrl', [
            '$scope', '$timeout', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'TagService', 'RiskService', '$stateParams', '$state',
            BackofficeKbOpRiskCtrl
        ]);

    /**
     * BO > KB > OPERATIONAL RISKS (ROLF)
     */
    function BackofficeKbOpRiskCtrl($scope, $timeout, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                    TagService, RiskService, $stateParams, $state) {
        $scope.tab = $stateParams.tab;
        TableHelperService.resetBookmarks();

        /*
         * Global helpers
         */
        $scope.selectTab = function (tab) {
            switch (tab) {
                case 'tags': $scope.currentTabIndex = 0; break;
                case 'risks': $scope.currentTabIndex = 1; break;
            }
        }
        $scope.selectTab($scope.tab);

        $scope.$on('$locationChangeSuccess', function (event, newUrl) {
            var tabName = newUrl.substring(newUrl.lastIndexOf('/') + 1);
            $scope.tab = tabName;
            $scope.selectTab(tabName);
        });

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
            $state.transitionTo('main.kb_mgmt.op_risk', {'tab': 'tags'});
            TableHelperService.watchSearch($scope, 'tags.query.filter', $scope.tags.query, $scope.updateTags, $scope.tags);
        };

        $scope.deselectTagsTab = function () {
            TableHelperService.unwatchSearch($scope.tags);
        };

        $scope.createNewTag = function (ev, tag) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', 'tag', CreateTagDialogCtrl],
                templateUrl: '/views/dialogs/create.tags.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'tag': tag
                }
            })
                .then(function (tag) {
                    TagService.createTag(tag,
                        function () {
                            $scope.updateTags();
                            toastr.success(gettextCatalog.getString('The tag "{{tagLabel}}" has been created successfully.',
                                {tagLabel: tag.label1}), gettext('Creation successful'));
                        },

                        function () {
                            $scope.createNewTag(ev, tag);
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
                                toastr.success(gettextCatalog.getString('The tag "{{tagLabel}}" has been updated successfully.',
                                    {tagLabel: tag.label1}), gettext('Update successful'));
                            },

                            function () {
                                $scope.createNewTag(ev, tag);
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
                        toastr.success(gettextCatalog.getString('The tag "{{label}}" has been deleted.',
                            {label: item.label1}), gettext('Deletion successful'));
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
                var outpromise = null;

                angular.forEach($scope.tags.selected, function (value, key) {
                    TagService.deleteTag(value.id, function () {
                        if (outpromise) {
                            $timeout.cancel(outpromise);
                        }

                        outpromise = $timeout(function() {
                            toastr.success(gettextCatalog.getString('{{count}} tags have been deleted.',
                                {count: $scope.tags.selected.length}), gettext('Deletion successful'));
                            $scope.tags.selected = [];
                            $scope.updateTags();
                        }, 350);
                    });
                });
            }, function() {
            });
        };


        /**
         * RISKS
         */
        $scope.risks = TableHelperService.build('label1', 10, 1, '');

        var risksTabSelected = false;

        $scope.$watchGroup(['risk_tag_filter'], function (newValue, oldValue) {
            if (risksTabSelected) {
                // Refresh contents
                $scope.updateRisks();
            }
        });

        $scope.updateRisks = function () {
            var query = angular.copy($scope.risks.query);
            if ($scope.risk_tag_filter > 0) {
                query.tag = $scope.risk_tag_filter;
            }

            if ($scope.risks.previousQueryOrder != $scope.risks.query.order) {
                $scope.risks.query.page = query.page = 1;
                $scope.risks.previousQueryOrder = $scope.risks.query.order;
            }

            $scope.risks.promise = RiskService.getRisks(query);
            $scope.risks.promise.then(
                function (data) {
                    $scope.risks.items = data;
                }
            )
        };
        $scope.removeRisksFilter = function () {
            TableHelperService.removeFilter($scope.risks);
        };

        $scope.resetRisksFilters = function () {
            $scope.risk_tag_filter = null;
        }

        $scope.selectRisksTab = function () {
            $state.transitionTo('main.kb_mgmt.op_risk', {'tab': 'risks'});
            risksTabSelected = true;
            TableHelperService.watchSearch($scope, 'risks.query.filter', $scope.risks.query, $scope.updateRisks, $scope.risks);

            TagService.getTags({limit: 0, order: '-label1'}).then(function (tags) {
                $scope.risk_tags = tags.tags;
            })
        };

        $scope.deselectRisksTab = function () {
            risksTabSelected = false;
            TableHelperService.unwatchSearch($scope.risks);
        };

        $scope.createNewRisk = function (ev, risk) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ConfigService', 'TagService', 'risk', CreateRiskDialogCtrl],
                templateUrl: '/views/dialogs/create.risks.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'risk': risk
                }
            })
                .then(function (risk) {
                    var riskBackup = angular.copy(risk);
                    var riskTagIds = [];

                    for (var i = 0; i < risk.tags.length; ++i) {
                        riskTagIds.push(risk.tags[i].id);
                    }

                    risk.tags = riskTagIds;

                    var cont = risk.cont;
                    risk.cont = undefined;

                    RiskService.createRisk(risk,
                        function () {
                            $scope.updateRisks();
                            toastr.success(gettextCatalog.getString('The risk "{{riskLabel}}" has been created successfully.',
                                {riskLabel: risk.label1}), gettext('Creation successful'));

                            if (cont) {
                                $scope.createNewRisk(ev);
                            }
                        },

                        function () {
                            $scope.createNewRisk(ev, riskBackup);
                        }
                    );
                });
        };

        $scope.editRisk = function (ev, risk) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            RiskService.getRisk(risk.id).then(function (riskData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'ConfigService', 'TagService', 'risk', CreateRiskDialogCtrl],
                    templateUrl: '/views/dialogs/create.risks.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'risk': riskData
                    }
                })
                    .then(function (risk) {
                        var riskBackup = angular.copy(risk);
                        var riskTagIds = [];

                        for (var i = 0; i < risk.tags.length; ++i) {
                            riskTagIds.push(risk.tags[i].id);
                        }

                        risk.tags = riskTagIds;

                        RiskService.updateRisk(risk,
                            function () {
                                $scope.updateRisks();
                                toastr.success(gettextCatalog.getString('The risk "{{riskLabel}}" has been updated successfully.',
                                    {riskLabel: risk.label1}), gettext('Update successful'));
                            },

                            function () {
                                $scope.editRisk(ev, riskBackup);
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
                        toastr.success(gettextCatalog.getString('The risk "{{label}}" has been deleted.',
                            {label: item.label1}), gettext('Deletion successful'));
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
                var outpromise = null;

                angular.forEach($scope.risks.selected, function (value, key) {
                    RiskService.deleteRisk(value.id, function () {
                        if (outpromise) {
                            $timeout.cancel(outpromise);
                        }

                        outpromise = $timeout(function() {
                            toastr.success(gettextCatalog.getString('{{count}} risks have been deleted.',
                                {count: $scope.risks.selected.length}), gettext('Deletion successful'));
                            $scope.risks.selected = [];

                            $scope.updateRisks();
                        }, 350);
                    });
                });



            }, function() {
            });
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

    function CreateRiskDialogCtrl($scope, $mdDialog, $q, ConfigService, TagService, risk) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        $scope.tagSearchText = null;
        $scope.tagSelectedItem = null;
        $scope.queryTagSearch = function (query) {
            var promise = $q.defer();
            TagService.getTags({filter: query}).then(function (e) {
                // Filter out values already selected
                var filtered = [];
                for (var j = 0; j < e.tags.length; ++j) {
                    var found = false;

                    for (var i = 0; i < $scope.risk.tags.length; ++i) {
                        if ($scope.risk.tags[i].id == e.tags[j].id) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        filtered.push(e.tags[j]);
                    }
                }

                promise.resolve(filtered);
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
                tags: [],
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.risk);
        };

        $scope.createAndContinue = function() {
            $scope.risk.cont = true;
            $mdDialog.hide($scope.risk);
        };
    }
})();
