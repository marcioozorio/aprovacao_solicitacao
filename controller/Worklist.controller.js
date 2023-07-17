sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"

], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast) {
    "use strict";

    return BaseController.extend("aprovacaosolicitacao.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */



        /*-*-*-*-*-*-*-*-*-* CÓDIGOS MANUAIS - INI *-*-*-*-*-*-*-*-*-*-*/

        onExecutar_V1: function(acao){
            
            debugger;
            
            var tb = this.getView().byId("table");
            var data = new Date();
            var hora = "PT" + data.getHours() + "H" + data.getMinutes() + "M" + data.getSeconds() + "S";
            
            const aSelItems = this.getView().byId("table").getSelectedItems();

            for (let i = 0; i < aSelItems.length; i++) {
                debugger;

                let id = aSelItems[i].mAggregations.cells[0].mProperties.title;
                let preco_novo = aSelItems[i].mAggregations.cells[3].mProperties.text;

                var oModel = this.getView().getModel();

                if ((preco_novo == 0) && (acao == 'A')) {
                        MessageToast.show("Valor do preço novo não pode ser zero. Id solic.: " + id);
                }else{
                    //var caminho = this.getView().getBindingContext().getPath;
                    var caminho = "/AdminSolicAlteracaoPrecoSet('" + id + "')";
                    var objeto = {
                        Id : id,
                        Status : acao,
                        Dtacao : data,
                        Hracao : hora,
                        PrecoNovo : preco_novo
                    }
            
                    //update
                    //oModel.read
                    //oModel.create
                    //oModel.delete
                    //oModel.calFunction
                    oModel.update(caminho, objeto, {
                                                        success:function(oRetorno, resposta){
                                                            if (acao == "A"){
                                                                MessageToast.show("Aprovado(s)");
                                                            }else{
                                                                MessageToast.show("Reprovado(s)");
                                                            }
                                                        },
                                                        error:function(oErro){
                                                            debugger
                                                        }
                                                    }
                    )
                }
            } 

        },

        onExecutar_V2: function(acao){
            
            debugger;
            
            let oTable = this.byId("table");
            let aContext =  oTable.getSelectedContexts();
            let model = this.getView().getModel();

            var data = new Date();
            var hora = "PT" + data.getHours() + "H" + data.getMinutes() + "M" + data.getSeconds() + "S";

            for (let i = 0; i < aContext.length; i++) {
                let path = aContext[i].getPath();

                //path = path + "/Status";

                model.setProperty(path+ "/Status", acao);
                model.setProperty(path+ "/Dtacao", data);
                model.setProperty(path+ "/Hracao", hora);
            };

            // Correspondente ao COMMIT
            try{
                model.submitChanges();
                MessageToast.show("Realizado com sucesso!");
            }catch{
                MessageToast.show("Erro na execução. Verificar!");
            }
        },

        onTesteHardCode : function(){
            //alert("teste")
            
            debugger;

            var oModel = this.getView().getModel();

            //var caminho = this.getView().getBindingContext().getPath;
            var caminho = "/AdminSolicAlteracaoPrecoSet('0010')";

            var objeto = {
                Id : "0010",
                Matnr : "NS0002",
                Dtsolic :"2023-06-28T00:00:00",
                Hrsolic : "PT13H30M30S",
                Status : "P",
                Dtacao : null,
                Hracao : "PT00H00M00S"
            }

            //update
            //oModel.read
            //oModel.create
            //oModel.delete
            //oModel.calFunction
            oModel.update(caminho, objeto, {
                                                success:function(oRetorno, resposta){
                                                    MessageToast.show("Show");
                                                },
                                                error:function(oErro){
                                                    debugger
                                                }
                                            }
            )
        },

        buscaPreco : function(){

            let oTable = this.byId("table");
            let aItems = oTable.getItems();

            if (aItems.length > 0 ){
                // loop nos itens
                aItems.forEach(async function(aEntry, i, array){
                    // bind contexxt
                    let bc = aEntry.getBindingContext();
                    let obj = bc.getObject();

                    let path = bc.getPath();

                    // paga pegar o material antigo, usar navegação
                    let model = this.getView().getModel();
                    let material = model.getProperty(path + '/toMaterial')

                    try{
                        if (material.BISMT !== ''){
                            let request = await this.ajaxRequest(material.BISMT); 
                            let dadosRetorno = request[0].d;
                            let preco = dadosRetorno.UnitPrice;
                            
                            model.setProperty(path + "/PrecoNovo", preco)
                            //debugger;
                        } 
                    }catch{
                        debugger;
                    }

                }.bind(this));
            }
        },

        ajaxRequest: function(idMaterial) {

            // necessário para implementar funcionamento sincrono
            // alguém esta te denvendo, se pagou, o problema foi resolvido. Senão, foi rejeitado

            return new Promise((resolve, reject) => {
                // necessário colcoar um proxy para não ter erro de CORS (XSS Script ....)
                // * somente em ambiente de teste. Necessário autorizar habilitar uso no site.

                $.ajax({
                    url    : "https://cors-anywhere.herokuapp.com/https://services.odata.org/V2/Northwind/Northwind.svc/Products(" + idMaterial + ")",
                    method : "GET",
                    dataType : 'json',
                    crosDomain : true,
                    success : (...args) => resolve(args),
                    error   : (...args) => reject(args)
                });

            });

        },




        /*-*-*-*-*-*-*-*-*-* CÓDIGOS MANUAIS - FIN *-*-*-*-*-*-*-*-*-*-*/






        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);



            // *** marcio.jesus - aqui ***

            this.buscaPreco();  
            

            // Alterando título da tabela
            // * Não funcionou, pois o sistema substitui minhas alterações.
            // * Foi necessário alterar worklistTableTitleCount no arquivo i18n
            /* let tituloPadrao = "Solicitações de Alteração de Preço";    
            let tituloAtual = sTitle; //document.getElementById("application-aprovacaosolicitacao-display-component---worklist--tableHeader-inner").innerHTML;
            let posicao = tituloAtual.indexOf('(');
            if (posicao != -1) {
                document.getElementById("application-aprovacaosolicitacao-display-component---worklist--tableHeader-inner").innerHTML = tituloPadrao + " " + tituloAtual.substring(posicao,99);
            }else{
                document.getElementById("application-aprovacaosolicitacao-display-component---worklist--tableHeader-inner").innerHTML = tituloPadrao;
            } */
            
        },

        

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        },


        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("Matnr", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/AdminSolicAlteracaoPrecoSet".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        }

    });
});
