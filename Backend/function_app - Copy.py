# import azure.functions as func
# import logging

# app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# @app.route(route="AzResumeTrigger")
# def AzResumeTrigger(req: func.HttpRequest) -> func.HttpResponse:
#     logging.info('Python HTTP trigger function processed a request.')

# @app.function_name(name="AzResumeTrigger")
# @app.route(route="hello", auth_level=func.AuthLevel.ANONYMOUS)
# @app.queue_output(arg_name="msg", queue_name="outqueue", connection="AzureWebJobsStorage")
# @app.cosmos_db_output(arg_name="outputDocument", database_name="PKsVisitorCounter", 
#     collection_name="VisitorCounterContainer", connection_string_setting="CosmosDbConnectionString")

# def test_function(req: func.HttpRequest, msg: func.Out[func.QueueMessage],
#     outputDocument: func.Out[func.Document]) -> func.HttpResponse:
#      logging.info('Python HTTP trigger function processed a request.')
#      logging.info('Python Cosmos DB trigger function processed a request.')
#      name = req.params.get('name')
#      if not name:
#         try:
#             req_body = req.get_json()
#         except ValueError:
#             pass
#         else:
#             name = req_body.get('name')

#      if name:
#         outputDocument.set(func.Document.from_dict({"id": name}))
#         msg.set(name)
#         return func.HttpResponse(f"Hello {name}!")
#      else:
#         return func.HttpResponse(
#                     "Please pass a name on the query string or in the request body",
#                     status_code=400
#                 )

import azure.functions as func
import logging

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="AzResumeTrigger", methods=["GET", "POST"], auth_level=func.AuthLevel.ANONYMOUS)
@app.queue_output(arg_name="msg", queue_name="outqueue", connection="AzureWebJobsStorage")
@app.cosmos_db_output(arg_name="outputDocument", database_name="PKsVisitorCounter", 
    container_name="VisitorCounterContainer", connection="CosmosDbConnectionString")
def AzResumeTrigger(req: func.HttpRequest, msg: func.Out[func.QueueMessage],
    outputDocument: func.Out[func.Document]) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    logging.info('Python Cosmos DB trigger function processed a request.')
    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            name = req_body.get('name')

    if name:
        outputDocument.set(func.Document.from_dict({"id": name}))
        msg.set(name)
        return func.HttpResponse(f"Hello {name}!")
    else:
        return func.HttpResponse(
                    "Please pass a name on the query string or in the request body",
                    status_code=400
                )
