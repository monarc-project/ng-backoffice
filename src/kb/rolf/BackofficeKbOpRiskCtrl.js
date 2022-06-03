(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbOpRiskCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'TableHelperService',
            'TagService', 'RiskService', 'UserService', 'ReferentialService', '$stateParams', '$state',
            BackofficeKbOpRiskCtrl
        ]);

    /**
     * BO > KB > OPERATIONAL RISKS (ROLF)
     */
    function BackofficeKbOpRiskCtrl($scope, toastr, $mdMedia, $mdDialog, gettextCatalog, TableHelperService,
                                    TagService, RiskService, UserService, ReferentialService, $stateParams, $state) {
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

        $scope.userLanguage = UserService.getUiLanguage();


        /**
         * TAGS
         */
        $scope.tags = TableHelperService.build('label' + $scope.userLanguage, 20, 1, '');

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
                templateUrl: 'views/anr/create.tags.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'tag': tag
                }
            })
                .then(function (tag) {
                    TagService.createTag(tag,
                        function () {
                            $scope.updateTags();
                            toastr.success(gettextCatalog.getString('The tag has been created successfully.',
                                {tagLabel: tag.label1}), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewTag(ev, tag);
                        }
                    );
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.editTag = function (ev, tag) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            TagService.getTag(tag.id).then(function (tagData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'tag', CreateTagDialogCtrl],
                    templateUrl: 'views/anr/create.tags.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'tag': tagData
                    }
                })
                    .then(function (tag) {
                        TagService.updateTag(tag,
                            function () {
                                $scope.updateTags();
                                toastr.success(gettextCatalog.getString('The tag has been edited successfully.',
                                    {tagLabel: tag.label1}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.createNewTag(ev, tag);
                            }
                        );
                    }, function (reject) {
                      $scope.handleRejectionDialog(reject);
                    });
            });
        };

        $scope.deleteTag = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete tag?',
                    {label: item.label1}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                TagService.deleteTag(item.id,
                    function () {
                        toastr.success(gettextCatalog.getString('The tag has been deleted.',
                            {label: item.label1}), gettextCatalog.getString('Deletion successful'));
                        $scope.updateTags();
                        $scope.tags.selected = $scope.tags.selected.filter(tagSelected => tagSelected.id != item.id);
                    }
                );
            });
        };

        $scope.deleteTagMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected tag(s)?',
                    {count: $scope.tags.selected.length}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.tags.selected.length; ++i) {
                    ids.push($scope.tags.selected[i].id);
                }

                TagService.deleteMassTag(ids, function () {
                    toastr.success(gettextCatalog.getString('{{count}} tags have been deleted.',
                        {count: $scope.tags.selected.length}), gettextCatalog.getString('Deletion successful'));
                    $scope.tags.selected = [];
                    $scope.updateTags();
                });
            }, function() {
            });
        };


        /**
         * RISKS
         */
        $scope.risks = TableHelperService.build('code', 20, 1, '');
        $scope.opRisksRef_filter = [];

        var risksTabSelected = false;

        $scope.$watchGroup(['risks.tag_filter'], function () {
            if (risksTabSelected) {
                // Refresh contents
                $scope.updateRisks();
            }
        });

        $scope.updateRisks = function () {
            var query = angular.copy($scope.risks.query);
            if ($scope.risks.tag_filter > 0) {
                query.tag = $scope.risks.tag_filter;
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
            $scope.resetRisksFilters();
        };

        $scope.resetRisksFilters = function () {
            $scope.risks.tag_filter = null;
        }

        $scope.selectRisksTab = function () {
            $state.transitionTo('main.kb_mgmt.op_risk', {'tab': 'risks'});
            risksTabSelected = true;
            TableHelperService.watchSearch($scope, 'risks.query.filter', $scope.risks.query, $scope.updateRisks, $scope.risks);

            ReferentialService.getReferentials({order: 'createdAt'}).then(function (data) {
                $scope.opRisksRef_filter.items = data;
                if (data['referentials'][0]) {
                  $scope.opRisksRef_filter.selected = data['referentials'][0].uuid;
                }else {
                  $scope.updateRisks();
                }
            });

            TagService.getTags({limit: 0, order: '-label1'}).then(function (tags) {
                $scope.risk_tags = tags.tags;
            })
        };

        $scope.deselectRisksTab = function () {
            risksTabSelected = false;
            TableHelperService.unwatchSearch($scope.risks);
        };

        $scope.updateMeasuresOpRisks = function (ev){
          var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

          $mdDialog.show({
              controller: ['$scope', '$mdDialog', 'referentials', updateMeasuresAMVDialogCtrl],
              templateUrl: 'views/anr/updateMeasures.amvs.html',
              targetEvent: ev,
              preserveScope: false,
              scope: $scope.$dialogScope.$new(),
              clickOutsideToClose: false,
              fullscreen: useFullScreen,
              locals: {
                  'referentials': $scope.opRisksRef_filter.items['referentials'],
              }
          })

              .then(function (params) {
                RiskService.patchRisks(params,
                  function () {
                    $scope.updateRisks();
                    toastr.success(gettextCatalog.getString('The risks have been edited successfully.'),
                      gettextCatalog.getString('Edition successful'));
                    $rootScope.$broadcast('opRiskUpdated');
                });
              }, function (reject) {
                $scope.handleRejectionDialog(reject);
              });
        }

        $scope.createNewRisk = function (ev, risk) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ConfigService', 'TagService', 'MeasureService', 'risk', 'referentials', CreateRiskDialogCtrl],
                templateUrl: 'views/anr/create.risks.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'risk': risk,
                    'referentials': $scope.opRisksRef_filter.items['referentials']
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
                            toastr.success(gettextCatalog.getString('The risk has been created successfully.',
                                {riskLabel: risk.label1}), gettextCatalog.getString('Creation successful'));

                            if (cont) {
                                $scope.createNewRisk(ev);
                            }
                        },

                        function () {
                            $scope.createNewRisk(ev, riskBackup);
                        }
                    );
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.editRisk = function (ev, risk) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            RiskService.getRisk(risk.id).then(function (riskData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'ConfigService', 'TagService', 'MeasureService', 'risk', 'referentials', CreateRiskDialogCtrl],
                    templateUrl: 'views/anr/create.risks.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'risk': riskData,
                        'referentials': $scope.opRisksRef_filter.items['referentials']
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
                                toastr.success(gettextCatalog.getString('The risk has been edited successfully.',
                                    {riskLabel: risk.label1}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editRisk(ev, riskBackup);
                            }
                        );
                    }, function (reject) {
                      $scope.handleRejectionDialog(reject);
                    });
            });
        };

        $scope.deleteRisk = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete risk?',
                    {label: item.label1}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                RiskService.deleteRisk(item.id,
                    function () {
                        toastr.success(gettextCatalog.getString('The risk has been deleted.',
                            {label: item.label1}), gettextCatalog.getString('Deletion successful'));
                        $scope.updateRisks();
                        $scope.risks.selected = $scope.risks.selected.filter(riskSelected => riskSelected.id != item.id);
                    }
                );
            });
        };

        $scope.deleteRiskMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected risk(s)?',
                    {count: $scope.risks.selected.length}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.risks.selected.length; ++i) {
                    ids.push($scope.risks.selected[i].id);
                }

                RiskService.deleteMassRisk(ids, function () {
                    toastr.success(gettextCatalog.getString('{{count}} risks have been deleted.',
                        {count: $scope.risks.selected.length}), gettextCatalog.getString('Deletion successful'));
                    $scope.risks.selected = [];

                    $scope.updateRisks();;
                });
            }, function() {
            });
        };
    }

    function CreateTagDialogCtrl($scope, $mdDialog, ConfigService, tag) {
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

    function CreateRiskDialogCtrl($scope, $mdDialog, $q, ConfigService, TagService, MeasureService, risk, referentials) {
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.riskopReferentials = referentials;


        TagService.getTags().then(function (data) {
           $scope.listTags = data['tags'];
        });

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
            if ($scope.risk.tags.length >0) {
            }
            else {
              $scope.risk.tags=[];
            }
            if (risk.measures.length == undefined) {
              $scope.risk.measures = [];
              referentials.forEach(function (ref){
                $scope.risk.measures[ref.uuid] = [];
              })
            } else {
              var measuresBackup = $scope.risk.measures;
              $scope.risk.measures = [];
              referentials.forEach(function (ref){
                $scope.risk.measures[ref.uuid] = measuresBackup.filter(function (measure) {
                    return (measure.referential.uuid == ref.uuid);
                })
              })
            }

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
                measures: [],
                tags: [],
            };
            referentials.forEach(function (ref){
              $scope.risk.measures[ref.uuid] = [];
            })
        }

        $scope.selectRiskopReferential = function (referential) {
            $scope.risk.referential = referential;
        }

        // Measures
        $scope.queryMeasureSearch = function (query) {
            var promise = $q.defer();
            MeasureService.getMeasures({filter: query, referential: $scope.risk.referential.uuid, order: 'code'}).then(function (e) {
              var filtered = [];
              for (var j = 0; j < e.measures.length; ++j) {
                  var found = false;
                  for (var i = 0; i < $scope.risk.measures[$scope.risk.referential.uuid].length; ++i) {

                      if ($scope.risk.measures[$scope.risk.referential.uuid][i].uuid == e.measures[j].uuid) {
                          found = true;
                          break;
                      }
                  }

                  if (!found) {
                      filtered.push(e.measures[j]);
                  }
              }

              promise.resolve(filtered);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {

            referentials.forEach(function (ref){
              var promise = $q.defer();
              if ($scope.risk.measures[ref.uuid] != undefined) {
                $scope.risk.measures[ref.uuid].forEach (function (measure) {
                  promise.resolve($scope.risk.measures.push(measure.uuid));
                })
              }
              return promise.promise;

            })

            delete $scope.risk.referential;
            $mdDialog.hide($scope.risk);
        };

        $scope.createAndContinue = function() {
            $scope.risk.cont = true;

            referentials.forEach(function (ref){
              var promise = $q.defer();
              if ($scope.risk.measures[ref.uuid] != undefined) {
                $scope.risk.measures[ref.uuid].forEach (function (measure) {
                  promise.resolve($scope.risk.measures.push(measure.uuid));
                })
              }
              return promise.promise;

            })

            delete $scope.risk.referential;
            $mdDialog.hide($scope.risk);
        };
    }

    function updateMeasuresAMVDialogCtrl($scope, $mdDialog, referentials) {

        $scope.referentials = referentials;
        $scope.fromReferential = [];
        $scope.toReferential = [];

        $scope.update = function (){
          var params = {
            fromReferential: $scope.fromReferential,
            toReferential: $scope.toReferential
          };
          $mdDialog.hide(params);
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }
})();
