import requests
from datetime import datetime, timedelta
import json
import openai

# Your OpenWeatherMap API key
API_KEY = <api_key>

#openai api key
openai.api_key = <openai.api_key>

# Coordinates for Melbourne, Australia
LAT = -37.8136
LON = 144.9631

# URL for the OpenWeatherMap API. This uses the 5 day / 3 hour forecast API endpoint
URL = f"https://api.openweathermap.org/data/2.5/forecast?lat={LAT}&lon={LON}&appid={API_KEY}&units=metric"

response = requests.get(URL)
data = response.json()  # Parsing the response JSON

def forecast_gen():
    # Function to extract date from timestamp
    def extract_date(timestamp):
        return datetime.fromtimestamp(timestamp).date()

    # Initialize a dictionary to hold weather data by date
    daily_weather = {}

    # Iterate over the weather data
    for entry in data['list']:
        date = extract_date(entry['dt'])
        max_temperature = entry['main']['temp_max']
        min_temperature = entry['main']['temp_min']
        description = entry['weather'][0]['description']
        # print(entry, type(entry))

        # Initialize the dictionary for a new date
        if date not in daily_weather:
            daily_weather[date] = {'max_temperatures': [], 'min_temperatures': [],'descriptions': []}

        # Append data for each date, pulling max temperatures, min temperatures and description for each 3hr time period
        daily_weather[date]['max_temperatures'].append(max_temperature)
        daily_weather[date]['min_temperatures'].append(min_temperature)
        daily_weather[date]['descriptions'].append(description)
    # print(daily_weather)

    summary_data = []
    # # # Prepare data for summary generation - max daily temp, min daily temp, list of all weather descriptions for the day
    for date, weather_info in daily_weather.items():
        max_temp = max(weather_info['max_temperatures'])
        min_temp = min(weather_info['min_temperatures'])
        descriptions = set(weather_info['descriptions'])
        day_summary = {
                'date': date.strftime('%Y-%m-%d'),
                'max_temperature': max_temp,
                'min_temperature': min_temp,
                'weather_conditions': list(descriptions)
                }
        summary_data.append(day_summary)

    try:
        # convert summary_data to a text format that the openai api can recognise, create the full prompt
        formatted_data = ""
        for day in summary_data:
            day_string = f"Date: {day['date']}, Max Temp: {day['max_temperature']}°C, Min Temp: {day['min_temperature']}°C, Conditions: {', '.join(day['weather_conditions'])}."
            formatted_data += day_string
        prompt = formatted_data
        prompt = "You are a friendly weather forecaster. Write a brief 5-day weather forecast, going day by day using the following data:\n" + prompt

        # call to openai api
        completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",
             messages=[{"role": "system", "content": prompt}]
            )

    except openai.error.Timeout as e:
        # Handle timeout error, e.g. retry or log
        print(f"OpenAI API request timed out: {e}")
    except openai.error.APIError as e:
        # Handle API error, e.g. retry or log
        print(f"OpenAI API returned an API Error: {e}")
    except openai.error.APIConnectionError as e:
        # Handle connection error, e.g. check network or log
        print(f"OpenAI API request failed to connect: {e}")
    except openai.error.InvalidRequestError as e:
        # Handle invalid request error, e.g. validate parameters or log
        print(f"OpenAI API request was invalid: {e}")
    except openai.error.AuthenticationError as e:
        # Handle authentication error, e.g. check credentials or log
        print(f"OpenAI API request was not authorized: {e}")
    except openai.error.PermissionError as e:
        # Handle permission error, e.g. check scope or log
        print(f"OpenAI API request was not permitted: {e}")
    except openai.error.RateLimitError as e:
        # Handle rate limit error, e.g. wait or log
        print(f"OpenAI API request exceeded rate limit: {e}")


    print(completion.choices[0].message)

forecast_gen()