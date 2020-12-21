(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeQuestionsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', 'toastr', 'gettextCatalog', 'QuestionService',
            BackofficeQuestionsCtrl
        ]);

    /**
     * KB > Questions Controller for the Backoffice module
     */
    function BackofficeQuestionsCtrl($scope, $mdDialog, $mdMedia, toastr, gettextCatalog, QuestionService) {
        $scope.questions = [];

        $scope.updateQuestions = function () {
            QuestionService.getQuestions().then(function (data) {
                if (data.questions) {
                    $scope.questions = data.questions;
                }
            });
        }
        $scope.updateQuestions();

        $scope.getTypeStr = function (str) {
            switch (str) {
                case 1: return gettextCatalog.getString('Simple text');
                case 2: return gettextCatalog.getString('Checkboxes');
                default: return 'Unknown';
            }
        }

        $scope.createNewQuestion = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'ConfigService', '$mdDialog', '$q', 'QuestionService', 'questions', CreateQuestionDialogCtrl],
                templateUrl: 'views/dialogs/create.questions.html',
                targetEvent: ev,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    questions: $scope.questions,
                }
            })
                .then(function (question) {
                    if(question.q && question.q.previous){
                        question.q.previous = question.q.previous.id;//BE need integer instead of whole object
                    }
                    QuestionService.createQuestion(question.q,
                        function (data) {
                            var finish = function () {
                                $scope.updateQuestions();
                                toastr.success(gettextCatalog.getString('The question has been created successfully.',
                                    {label: $scope._langField(question.q,'label')}), gettextCatalog.getString('Creation successful'));
                            };

                            if (question.q.type == 2) {
                                QuestionService.updateChoices({questionId: data.id, choice: question.c}, function () {
                                    finish();
                                });
                            } else {
                                finish();
                            }

                        }
                    );
                });
        };

        $scope.editQuestion = function (ev, item) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'ConfigService', '$mdDialog', '$q', 'QuestionService', 'questions', 'question', CreateQuestionDialogCtrl],
                templateUrl: 'views/dialogs/create.questions.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                scope: $scope.$dialogScope.$new(),
                locals: {
                    questions: $scope.questions,
                    question: item
                }
            })
                .then(function (question) {
                    if(question.q && question.q.previous){
                        question.q.previous = question.q.previous.id;//BE need integer instead of whole object
                    }
                    QuestionService.updateQuestion(question.q,
                        function () {
                            var finish = function () {
                                $scope.updateQuestions();
                                toastr.success(gettextCatalog.getString('The question has been edited successfully.',
                                    {label: $scope._langField(question.q,'label')}), gettextCatalog.getString('Edition successful'));
                            };

                            if (question.q.type == 2) {
                                QuestionService.updateChoices({questionId: question.q.id, choice: question.c}, function () {
                                    finish();
                                });
                            } else {
                                finish();
                            }

                        }
                    );
                });
        };


        $scope.deleteQuestion = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete this question?',
                    {label: item.description}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                QuestionService.deleteQuestion(item.id,
                    function () {
                        $scope.updateQuestions();
                        toastr.success(gettextCatalog.getString('The question has been deleted.',
                            {label: item.description}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };
    }


    function CreateQuestionDialogCtrl($scope, ConfigService, $mdDialog, $q, QuestionService, questions, question) {
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (question) {
            $scope.question = angular.copy(question);

            // Determine position
            for (var i = 0; i < questions.length; ++i) {
                if ($scope.question.id == questions[i].id) {
                    if (i == 0) {
                        $scope.question.implicitPosition = 1;
                    } else if (i == questions.length - 1) {
                        $scope.question.implicitPosition = 2;
                    } else {
                        $scope.question.implicitPosition = 3;
                        $scope.question.previous = questions[i - 1];
                    }
                }
            }

            if ($scope.question.type_id) {
                $scope.question.type = $scope.question.type_id;
            }

            $scope.choices = $scope.question.choices;
        } else {
            $scope.question = {
                type: null,
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                multichoice: 0,
                implicitPosition: 2
            };

            $scope.choices = [];
        };

        $scope.addChoice = function (idx) {
            $scope.choices.splice((idx != undefined) ? idx : $scope.choices.length, 0, {
                id: null,
                label1:'',
                label2:'',
                label3:'',
                label4:'',
            });
        };

        $scope.removeChoice = function (idx) {
            $scope.choices.splice(idx, 1);
        };

        $scope.queryItemSearch = function (query) {
            var q = $q.defer();

            QuestionService.getQuestions({filter: query, order: 'position'}).then(function (x) {
                q.resolve(x.questions);

            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide({q: $scope.question, c: $scope.choices});
        };
    }

})();
