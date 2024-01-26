import azure.functions as func
import logging
from azure.cosmos import CosmosClient
import os

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="AzResumeTrigger")
def AzResumeTrigger(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    endpoint = os.environ.get("CosmosEndpoint")
    account_key = os.environ.get("CosmosKey")

    if not endpoint or not account_key:
        raise ValueError("CosmosEndpoint and CosmosKey must be set as environment variables.")
  
    database_name = "PKsVisitorCounter"
    container_name = "VisitorCounterContainer"
    client = CosmosClient(endpoint, account_key)
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)
    query = f"SELECT * FROM c WHERE c.id = '1'"
    items = list(container.query_items(query, enable_cross_partition_query=True))
    if items:
        count = items[0]['count']
        count = str(int(count) + 1)
        items[0]['count'] = count
        container.replace_item(items[0]['id'], items[0])
        return func.HttpResponse(count, status_code=200)
    else:
        return func.HttpResponse("Counter document not found", status_code=404)
    
