### Request

```bash
curl -X POST "http://localhost:3000/api/facilities/find"   -H "Content-Type: application/json"   -d '{
    "address": "Austin, TX",
    "facilityType": "health"
  }'
```

### Response

```json
{
  "location": {
    "lat": 30.267153,
    "lng": -97.7430608,
    "formatted_address": "Austin, TX, USA",
    "source": "google",
    "confidence": 1,
    "components": {
      "city": "Austin",
      "state": "TX",
      "country": "US"
    }
  },
  "facilities": [
    {
      "id": "vha_674QB",
      "name": "Austin VA Mobile Medical Unit",
      "classification": "Other Outpatient Services (OOS)",
      "facilityType": "va_health_facility",
      "location": {
        "lat": 30.20774544,
        "lng": -97.69021869,
        "address": {
          "street": "7901 Metropolis Drive",
          "city": "Austin",
          "state": "TX",
          "zipcode": "78744-3111",
          "full": "7901 Metropolis Drive, Austin, TX 78744-3111"
        }
      },
      "contact": {
        "phone": "800-423-2111",
        "fax": "254-743-2338",
        "website": "https://www.va.gov/find-locations/facility/vha_674QB",
        "email": ""
      },
      "hours": {
        "monday": "Closed",
        "tuesday": "Closed",
        "wednesday": "Closed",
        "thursday": "Closed",
        "friday": "Closed",
        "saturday": "Closed",
        "sunday": "Closed"
      },
      "services": [],
      "specialties": [],
      "accessibility": [],
      "parking": null,
      "transportation": {
        "hasShuttle": false,
        "shuttleInfo": null,
        "publicTransit": null,
        "parking": {
          "available": false,
          "details": null
        }
      },
      "distance": 5.18,
      "distanceFormatted": "5.18 miles",
      "operatingStatus": "NORMAL",
      "operatingStatusInfo": null,
      "timeZone": "America/Chicago",
      "lastUpdated": null
    },
    {
      "id": "vha_674BY",
      "name": "Austin VA Clinic",
      "classification": "Multi-Specialty CBOC",
      "facilityType": "va_health_facility",
      "location": {
        "lat": 30.205656,
        "lng": -97.6903515,
        "address": {
          "street": "7901 Metropolis Drive",
          "city": "Austin",
          "state": "TX",
          "zipcode": "78744-3111",
          "full": "7901 Metropolis Drive, Austin, TX 78744-3111"
        }
      },
      "contact": {
        "phone": "800-423-2111",
        "fax": "512-823-4125",
        "website": "https://www.va.gov/central-texas-health-care/locations/austin-va-clinic/",
        "email": ""
      },
      "hours": {
        "monday": "800AM-430PM",
        "tuesday": "800AM-430PM",
        "wednesday": "800AM-430PM",
        "thursday": "800AM-430PM",
        "friday": "800AM-430PM",
        "saturday": "Closed",
        "sunday": "Closed"
      },
      "services": [],
      "specialties": [],
      "accessibility": [],
      "parking": null,
      "transportation": {
        "hasShuttle": false,
        "shuttleInfo": null,
        "publicTransit": null,
        "parking": {
          "available": false,
          "details": null
        }
      },
      "distance": 5.29,
      "distanceFormatted": "5.29 miles",
      "operatingStatus": "NORMAL",
      "operatingStatusInfo": null,
      "timeZone": "America/Chicago",
      "lastUpdated": null
    },
    {
      "id": "vha_674GD",
      "name": "Cedar Park VA Clinic",
      "classification": "Primary Care CBOC",
      "facilityType": "va_health_facility",
      "location": {
        "lat": 30.5310884,
        "lng": -97.81286592,
        "address": {
          "street": "1401 Medical Parkway",
          "city": "Cedar Park",
          "state": "TX",
          "zipcode": "78613-2216",
          "full": "1401 Medical Parkway, Cedar Park, TX 78613-2216"
        }
      },
      "contact": {
        "phone": "800-423-2111",
        "fax": "254-743-1566",
        "website": "https://www.va.gov/central-texas-health-care/locations/cedar-park-va-clinic/",
        "email": ""
      },
      "hours": {
        "monday": "800AM-430PM",
        "tuesday": "800AM-430PM",
        "wednesday": "800AM-430PM",
        "thursday": "800AM-430PM",
        "friday": "800AM-430PM",
        "saturday": "Closed",
        "sunday": "Closed"
      },
      "services": [],
      "specialties": [],
      "accessibility": [],
      "parking": null,
      "transportation": {
        "hasShuttle": false,
        "shuttleInfo": null,
        "publicTransit": null,
        "parking": {
          "available": false,
          "details": null
        }
      },
      "distance": 18.71,
      "distanceFormatted": "18.71 miles",
      "operatingStatus": "NORMAL",
      "operatingStatusInfo": null,
      "timeZone": "America/Chicago",
      "lastUpdated": null
    },
    {
      "id": "vha_671GL",
      "name": "New Braunfels VA Clinic",
      "classification": "Other Outpatient Services (OOS)",
      "facilityType": "va_health_facility",
      "location": {
        "lat": 29.72015179,
        "lng": -98.062317,
        "address": {
          "street": "790 Generations Drive",
          "city": "New Braunfels",
          "state": "TX",
          "zipcode": "78130-0086",
          "full": "790 Generations Drive, New Braunfels, TX 78130-0086"
        }
      },
      "contact": {
        "phone": "830-643-0717",
        "fax": "830-629-2438",
        "website": "https://www.va.gov/south-texas-health-care/locations/new-braunfels-va-clinic/",
        "email": ""
      },
      "hours": {
        "monday": "800AM-430PM",
        "tuesday": "800AM-430PM",
        "wednesday": "800AM-430PM",
        "thursday": "800AM-430PM",
        "friday": "800AM-430PM",
        "saturday": "Closed",
        "sunday": "Closed"
      },
      "services": [],
      "specialties": [],
      "accessibility": [],
      "parking": null,
      "transportation": {
        "hasShuttle": false,
        "shuttleInfo": null,
        "publicTransit": null,
        "parking": {
          "available": false,
          "details": null
        }
      },
      "distance": 42.35,
      "distanceFormatted": "42.35 miles",
      "operatingStatus": "NORMAL",
      "operatingStatusInfo": null,
      "timeZone": "America/Chicago",
      "lastUpdated": null
    }
  ],
  "nearestFacility": {
    "id": "vha_674QB",
    "name": "Austin VA Mobile Medical Unit",
    "classification": "Other Outpatient Services (OOS)",
    "facilityType": "va_health_facility",
    "location": {
      "lat": 30.20774544,
      "lng": -97.69021869,
      "address": {
        "street": "7901 Metropolis Drive",
        "city": "Austin",
        "state": "TX",
        "zipcode": "78744-3111",
        "full": "7901 Metropolis Drive, Austin, TX 78744-3111"
      }
    },
    "contact": {
      "phone": "800-423-2111",
      "fax": "254-743-2338",
      "website": "https://www.va.gov/find-locations/facility/vha_674QB",
      "email": ""
    },
    "hours": {
      "monday": "Closed",
      "tuesday": "Closed",
      "wednesday": "Closed",
      "thursday": "Closed",
      "friday": "Closed",
      "saturday": "Closed",
      "sunday": "Closed"
    },
    "services": [],
    "specialties": [],
    "accessibility": [],
    "parking": null,
    "transportation": {
      "hasShuttle": false,
      "shuttleInfo": null,
      "publicTransit": null,
      "parking": {
        "available": false,
        "details": null
      }
    },
    "distance": 5.18,
    "distanceFormatted": "5.18 miles",
    "operatingStatus": "NORMAL",
    "operatingStatusInfo": null,
    "timeZone": "America/Chicago",
    "lastUpdated": null
  },
  "weatherAnalysis": {
    "severity": "severe",
    "transportImpact": "high",
    "recommendations": [
      "Use covered transit stops",
      "Consider rideshare or taxi options",
      "Rain expected later - plan accordingly"
    ],
    "warnings": [
      "Heavy precipitation: 1.54\" per hour"
    ],
    "details": {
      "temperature": 75,
      "feelsLike": 77,
      "precipitation": 1.54,
      "windSpeed": 5,
      "visibility": 6,
      "condition": "rain",
      "alerts": 0
    },
    "rawData": {
      "current": {
        "temperature": 75,
        "feelsLike": 77,
        "humidity": 91,
        "pressure": 1018,
        "visibility": 6,
        "windSpeed": 5,
        "windDirection": 0,
        "description": "moderate rain",
        "condition": "rain",
        "icon": "10d",
        "precipitation": 1.54,
        "cloudCover": 75
      },
      "forecast": [
        {
          "time": "2025-07-10T00:00:00.000Z",
          "temperature": 78,
          "condition": "clouds",
          "description": "broken clouds",
          "precipitation": 0,
          "windSpeed": 8
        },
        {
          "time": "2025-07-10T03:00:00.000Z",
          "temperature": 75,
          "condition": "rain",
          "description": "light rain",
          "precipitation": 2.52,
          "windSpeed": 4
        },
        {
          "time": "2025-07-10T06:00:00.000Z",
          "temperature": 74,
          "condition": "rain",
          "description": "light rain",
          "precipitation": 0.68,
          "windSpeed": 7
        },
        {
          "time": "2025-07-10T09:00:00.000Z",
          "temperature": 75,
          "condition": "rain",
          "description": "light rain",
          "precipitation": 0.14,
          "windSpeed": 6
        },
        {
          "time": "2025-07-10T12:00:00.000Z",
          "temperature": 75,
          "condition": "clouds",
          "description": "broken clouds",
          "precipitation": 0,
          "windSpeed": 5
        },
        {
          "time": "2025-07-10T15:00:00.000Z",
          "temperature": 78,
          "condition": "rain",
          "description": "light rain",
          "precipitation": 0.25,
          "windSpeed": 9
        },
        {
          "time": "2025-07-10T18:00:00.000Z",
          "temperature": 82,
          "condition": "clouds",
          "description": "broken clouds",
          "precipitation": 0,
          "windSpeed": 7
        },
        {
          "time": "2025-07-10T21:00:00.000Z",
          "temperature": 93,
          "condition": "clouds",
          "description": "scattered clouds",
          "precipitation": 0,
          "windSpeed": 13
        }
      ],
      "alerts": [],
      "location": {
        "name": "Austin",
        "country": "US",
        "lat": 30.267153,
        "lng": -97.7430608
      },
      "provider": "openweathermap",
      "timestamp": "2025-07-09T21:13:20.335Z"
    }
  },
  "transportationOptions": {
    "origin": {
      "lat": 30.267153,
      "lng": -97.7430608,
      "formatted_address": "Austin, TX, USA",
      "source": "google",
      "confidence": 1,
      "components": {
        "city": "Austin",
        "state": "TX",
        "country": "US"
      }
    },
    "destination": {
      "lat": 30.20774544,
      "lng": -97.69021869,
      "address": "7901 Metropolis Drive, Austin, TX 78744-3111"
    },
    "options": {
      "transit": {
        "available": true,
        "mode": "transit",
        "routes": [
          {
            "duration": "57 mins",
            "durationValue": 3415,
            "distance": "7.7 mi",
            "distanceValue": 12385,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "19 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "2507 Riverside/Pleasant Valley",
                  "departureTime": "4:37 PM",
                  "arrivalTime": "4:52 PM",
                  "numStops": 13,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to 2007 Pleasant Valley/Riverside",
                "duration": "1 min",
                "distance": "210 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady LVA Clinicane EB",
                "duration": "21 mins",
                "distance": "4.4 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "2007 Pleasant Valley/Riverside",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:08 PM",
                  "arrivalTime": "5:27 PM",
                  "numStops": 13,
                  "headsign": "Shady LVA Clinicane EB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          },
          {
            "duration": "1 hour 11 mins",
            "durationValue": 4244,
            "distance": "9.0 mi",
            "distanceValue": 14410,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 104 8th/Congress",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards William Cannon SB",
                "duration": "22 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "7",
                  "vehicle": "Bus",
                  "departureStop": "104 8th/Congress",
                  "arrivalStop": "Riverside/Burton",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:42 PM",
                  "numStops": 12,
                  "headsign": "William Cannon SB"
                }
              },
              {
                "instruction": "Walk to Riverside/Willow Creek",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Pleasant Valley WB",
                "duration": "42 mins",
                "distance": "5.5 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "Riverside/Willow Creek",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "4:51 PM",
                  "arrivalTime": "5:27 PM",
                  "numStops": 17,
                  "headsign": "Pleasant Valley WB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          },
          {
            "duration": "1 hour 8 mins",
            "durationValue": 4063,
            "distance": "6.8 mi",
            "distanceValue": 10865,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "27 mins",
                "distance": "5.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "7343 Riverside/Coriander",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:53 PM",
                  "numStops": 21,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "31 mins",
                "distance": "1.4 mi",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 1.25,
              "text": "$1.25"
            }
          },
          {
            "duration": "45 mins",
            "durationValue": 2692,
            "distance": "7.4 mi",
            "distanceValue": 11974,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 115 7th/Colorado",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady EB",
                "duration": "19 mins",
                "distance": "3.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "4",
                  "vehicle": "Bus",
                  "departureStop": "115 7th/Colorado",
                  "arrivalStop": "5119 Eastside Bus Plaza Bay J",
                  "departureTime": "5:13 PM",
                  "arrivalTime": "5:28 PM",
                  "numStops": 14,
                  "headsign": "Shady EB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "2 mins",
                "distance": "0.1 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 0 mins",
            "durationValue": 3602,
            "distance": "7.8 mi",
            "distanceValue": 12591,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Cesar Chavez/Brazos",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Eastside Bus Plaza SB",
                "duration": "24 mins",
                "distance": "3.3 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "2",
                  "vehicle": "Bus",
                  "departureStop": "Cesar Chavez/Brazos",
                  "arrivalStop": "5207 Eastside Bus Plaza Bay G",
                  "departureTime": "5:00 PM",
                  "arrivalTime": "5:17 PM",
                  "numStops": 10,
                  "headsign": "Eastside Bus Plaza SB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "3 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 3 mins",
            "durationValue": 3754,
            "distance": "7.7 mi",
            "distanceValue": 12385,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "19 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "2507 Riverside/Pleasant Valley",
                  "departureTime": "5:38 PM",
                  "arrivalTime": "5:55 PM",
                  "numStops": 13,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to 2007 Pleasant Valley/Riverside",
                "duration": "1 min",
                "distance": "210 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady LVA Clinicane EB",
                "duration": "17 mins",
                "distance": "4.4 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "2007 Pleasant Valley/Riverside",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "6:17 PM",
                  "arrivalTime": "6:34 PM",
                  "numStops": 13,
                  "headsign": "Shady LVA Clinicane EB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          }
        ],
        "bestRoute": {
          "duration": "57 mins",
          "durationValue": 3415,
          "distance": "7.7 mi",
          "distanceValue": 12385,
          "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
          "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
          "overview": "",
          "steps": [
            {
              "instruction": "Walk to Guadalupe/4th",
              "duration": "7 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Bus towards ABIA Airport SB",
              "duration": "19 mins",
              "distance": "3.0 mi",
              "travelMode": "TRANSIT",
              "transit": {
                "line": "20",
                "vehicle": "Bus",
                "departureStop": "Guadalupe/4th",
                "arrivalStop": "2507 Riverside/Pleasant Valley",
                "departureTime": "4:37 PM",
                "arrivalTime": "4:52 PM",
                "numStops": 13,
                "headsign": "ABIA Airport SB"
              }
            },
            {
              "instruction": "Walk to 2007 Pleasant Valley/Riverside",
              "duration": "1 min",
              "distance": "210 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Bus towards Shady LVA Clinicane EB",
              "duration": "21 mins",
              "distance": "4.4 mi",
              "travelMode": "TRANSIT",
              "transit": {
                "line": "228",
                "vehicle": "Bus",
                "departureStop": "2007 Pleasant Valley/Riverside",
                "arrivalStop": "Metropolis/Veterans Clinic",
                "departureTime": "5:08 PM",
                "arrivalTime": "5:27 PM",
                "numStops": 13,
                "headsign": "Shady LVA Clinicane EB"
              }
            },
            {
              "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
              "duration": "1 min",
              "distance": "95 ft",
              "travelMode": "WALKING"
            }
          ],
          "fare": {
            "currency": "USD",
            "value": 2.5,
            "text": "$2.50"
          }
        },
        "alternatives": [
          {
            "duration": "1 hour 11 mins",
            "durationValue": 4244,
            "distance": "9.0 mi",
            "distanceValue": 14410,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 104 8th/Congress",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards William Cannon SB",
                "duration": "22 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "7",
                  "vehicle": "Bus",
                  "departureStop": "104 8th/Congress",
                  "arrivalStop": "Riverside/Burton",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:42 PM",
                  "numStops": 12,
                  "headsign": "William Cannon SB"
                }
              },
              {
                "instruction": "Walk to Riverside/Willow Creek",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Pleasant Valley WB",
                "duration": "42 mins",
                "distance": "5.5 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "Riverside/Willow Creek",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "4:51 PM",
                  "arrivalTime": "5:27 PM",
                  "numStops": 17,
                  "headsign": "Pleasant Valley WB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          },
          {
            "duration": "1 hour 8 mins",
            "durationValue": 4063,
            "distance": "6.8 mi",
            "distanceValue": 10865,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "27 mins",
                "distance": "5.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "7343 Riverside/Coriander",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:53 PM",
                  "numStops": 21,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "31 mins",
                "distance": "1.4 mi",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 1.25,
              "text": "$1.25"
            }
          },
          {
            "duration": "45 mins",
            "durationValue": 2692,
            "distance": "7.4 mi",
            "distanceValue": 11974,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 115 7th/Colorado",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady EB",
                "duration": "19 mins",
                "distance": "3.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "4",
                  "vehicle": "Bus",
                  "departureStop": "115 7th/Colorado",
                  "arrivalStop": "5119 Eastside Bus Plaza Bay J",
                  "departureTime": "5:13 PM",
                  "arrivalTime": "5:28 PM",
                  "numStops": 14,
                  "headsign": "Shady EB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "2 mins",
                "distance": "0.1 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 0 mins",
            "durationValue": 3602,
            "distance": "7.8 mi",
            "distanceValue": 12591,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Cesar Chavez/Brazos",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Eastside Bus Plaza SB",
                "duration": "24 mins",
                "distance": "3.3 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "2",
                  "vehicle": "Bus",
                  "departureStop": "Cesar Chavez/Brazos",
                  "arrivalStop": "5207 Eastside Bus Plaza Bay G",
                  "departureTime": "5:00 PM",
                  "arrivalTime": "5:17 PM",
                  "numStops": 10,
                  "headsign": "Eastside Bus Plaza SB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "3 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 3 mins",
            "durationValue": 3754,
            "distance": "7.7 mi",
            "distanceValue": 12385,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "19 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "2507 Riverside/Pleasant Valley",
                  "departureTime": "5:38 PM",
                  "arrivalTime": "5:55 PM",
                  "numStops": 13,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to 2007 Pleasant Valley/Riverside",
                "duration": "1 min",
                "distance": "210 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady LVA Clinicane EB",
                "duration": "17 mins",
                "distance": "4.4 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "2007 Pleasant Valley/Riverside",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "6:17 PM",
                  "arrivalTime": "6:34 PM",
                  "numStops": 13,
                  "headsign": "Shady LVA Clinicane EB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          }
        ]
      },
      "driving": {
        "available": true,
        "mode": "driving",
        "routes": [
          {
            "duration": "15 mins",
            "durationValue": 913,
            "distance": "6.8 mi",
            "distanceValue": 10967,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "E 7th St and US-183",
            "steps": [
              {
                "instruction": "Head east on E 5th St. toward Brazos St",
                "duration": "1 min",
                "distance": "410 ft",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Turn left onto Brazos St",
                "duration": "1 min",
                "distance": "0.1 mi",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Turn right onto E 7th StPass by Wendy's (on the right in 0.5 mi)",
                "duration": "9 mins",
                "distance": "3.0 mi",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Take the ramp to US-183 N",
                "duration": "1 min",
                "distance": "0.6 mi",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Continue onto US-183 S",
                "duration": "1 min",
                "distance": "499 ft",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Take the 183 S ramp to Lockhart",
                "duration": "1 min",
                "distance": "0.2 mi",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Merge onto S Hwy 183/183 Toll/Bastrop Hwy/Lockhart HwyToll road",
                "duration": "1 min",
                "distance": "0.5 mi",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Continue onto US-183/S Hwy 183/Lockhart HwyToll road",
                "duration": "2 mins",
                "distance": "1.8 mi",
                "travelMode": "DRIVING"
              },
              {
                "instruction": "Turn right onto Metropolis Dr",
                "duration": "1 min",
                "distance": "0.4 mi",
                "travelMode": "DRIVING"
              }
            ]
          }
        ],
        "bestRoute": {
          "duration": "15 mins",
          "durationValue": 913,
          "distance": "6.8 mi",
          "distanceValue": 10967,
          "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
          "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
          "overview": "E 7th St and US-183",
          "steps": [
            {
              "instruction": "Head east on E 5th St. toward Brazos St",
              "duration": "1 min",
              "distance": "410 ft",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Turn left onto Brazos St",
              "duration": "1 min",
              "distance": "0.1 mi",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Turn right onto E 7th StPass by Wendy's (on the right in 0.5 mi)",
              "duration": "9 mins",
              "distance": "3.0 mi",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Take the ramp to US-183 N",
              "duration": "1 min",
              "distance": "0.6 mi",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Continue onto US-183 S",
              "duration": "1 min",
              "distance": "499 ft",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Take the 183 S ramp to Lockhart",
              "duration": "1 min",
              "distance": "0.2 mi",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Merge onto S Hwy 183/183 Toll/Bastrop Hwy/Lockhart HwyToll road",
              "duration": "1 min",
              "distance": "0.5 mi",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Continue onto US-183/S Hwy 183/Lockhart HwyToll road",
              "duration": "2 mins",
              "distance": "1.8 mi",
              "travelMode": "DRIVING"
            },
            {
              "instruction": "Turn right onto Metropolis Dr",
              "duration": "1 min",
              "distance": "0.4 mi",
              "travelMode": "DRIVING"
            }
          ]
        },
        "alternatives": []
      },
      "walking": {
        "available": true,
        "mode": "walking",
        "routes": [
          {
            "duration": "2 hours 22 mins",
            "durationValue": 8491,
            "distance": "6.3 mi",
            "distanceValue": 10158,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "E Riverside Dr",
            "steps": [
              {
                "instruction": "Head south on Congress Ave. toward W 4th St",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn left onto Ann and Roy Butler Hike and Bike Trail AltTake the stairs",
                "duration": "1 min",
                "distance": "266 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight left onto Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
                "duration": "2 mins",
                "distance": "381 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
                "duration": "3 mins",
                "distance": "0.1 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
                "duration": "2 mins",
                "distance": "0.1 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
                "duration": "6 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Slight right onto Ann and Roy Butler Hike and Bike Trail Alt",
                "duration": "1 min",
                "distance": "10 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn right onto Ann and Roy Butler Hike and Bike Trl",
                "duration": "8 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Sharp right onto Manlove St",
                "duration": "1 min",
                "distance": "72 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn left onto E Riverside DrPass by 7-Eleven (on the left in 0.3 mi)",
                "duration": "1 hour 19 mins",
                "distance": "3.5 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn right to stay on E Riverside Dr",
                "duration": "1 min",
                "distance": "43 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn left onto Metro Center Dr",
                "duration": "12 mins",
                "distance": "0.5 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn left onto Metlink Rd",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Turn left onto Metropolis Dr",
                "duration": "5 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              }
            ]
          }
        ],
        "bestRoute": {
          "duration": "2 hours 22 mins",
          "durationValue": 8491,
          "distance": "6.3 mi",
          "distanceValue": 10158,
          "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
          "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
          "overview": "E Riverside Dr",
          "steps": [
            {
              "instruction": "Head south on Congress Ave. toward W 4th St",
              "duration": "7 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn left onto Ann and Roy Butler Hike and Bike Trail AltTake the stairs",
              "duration": "1 min",
              "distance": "266 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight left onto Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
              "duration": "2 mins",
              "distance": "381 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
              "duration": "3 mins",
              "distance": "0.1 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
              "duration": "2 mins",
              "distance": "0.1 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
              "duration": "6 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
              "duration": "5 mins",
              "distance": "0.2 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight right to stay on Ann and Roy Butler Hike and Bike Trl/Roberta Crenshaw Pedestrian Walkway",
              "duration": "4 mins",
              "distance": "0.2 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Slight right onto Ann and Roy Butler Hike and Bike Trail Alt",
              "duration": "1 min",
              "distance": "10 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn right onto Ann and Roy Butler Hike and Bike Trl",
              "duration": "8 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Sharp right onto Manlove St",
              "duration": "1 min",
              "distance": "72 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn left onto E Riverside DrPass by 7-Eleven (on the left in 0.3 mi)",
              "duration": "1 hour 19 mins",
              "distance": "3.5 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn right to stay on E Riverside Dr",
              "duration": "1 min",
              "distance": "43 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn left onto Metro Center Dr",
              "duration": "12 mins",
              "distance": "0.5 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn left onto Metlink Rd",
              "duration": "7 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Turn left onto Metropolis Dr",
              "duration": "5 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            }
          ]
        },
        "alternatives": []
      },
      "bicycling": null,
      "rideshare": {
        "available": true,
        "options": [
          {
            "provider": "Uber",
            "deepLink": "uber://?action=setPickup&pickup[latitude]=30.267153&pickup[longitude]=-97.7430608&dropoff[latitude]=30.20774544&dropoff[longitude]=-97.69021869",
            "webLink": "https://uber.com/ul/?pickup[latitude]=30.267153&pickup[longitude]=-97.7430608&dropoff[latitude]=30.20774544&dropoff[longitude]=-97.69021869",
            "estimatedTime": "15-25 minutes",
            "estimatedCost": "$12-25",
            "description": "Request an Uber ride"
          },
          {
            "provider": "Lyft",
            "deepLink": "lyft://ridetype?id=lyft&destination[latitude]=30.20774544&destination[longitude]=-97.69021869&pickup[latitude]=30.267153&pickup[longitude]=-97.7430608",
            "webLink": "https://lyft.com/ride?destination[latitude]=30.20774544&destination[longitude]=-97.69021869&pickup[latitude]=30.267153&pickup[longitude]=-97.7430608",
            "estimatedTime": "15-25 minutes",
            "estimatedCost": "$12-25",
            "description": "Request a Lyft ride"
          }
        ]
      }
    },
    "recommendations": [
      "Public transit recommended: 57 minutes travel time",
      "Alternative: driving (15 minutes)",
      "For convenience, consider rideshare services (Uber/Lyft)"
    ],
    "bestOption": {
      "type": "transit",
      "score": 85,
      "reason": "Public transit provides good value and avoids parking concerns",
      "data": {
        "available": true,
        "mode": "transit",
        "routes": [
          {
            "duration": "57 mins",
            "durationValue": 3415,
            "distance": "7.7 mi",
            "distanceValue": 12385,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "19 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "2507 Riverside/Pleasant Valley",
                  "departureTime": "4:37 PM",
                  "arrivalTime": "4:52 PM",
                  "numStops": 13,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to 2007 Pleasant Valley/Riverside",
                "duration": "1 min",
                "distance": "210 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady LVA Clinicane EB",
                "duration": "21 mins",
                "distance": "4.4 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "2007 Pleasant Valley/Riverside",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:08 PM",
                  "arrivalTime": "5:27 PM",
                  "numStops": 13,
                  "headsign": "Shady LVA Clinicane EB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          },
          {
            "duration": "1 hour 11 mins",
            "durationValue": 4244,
            "distance": "9.0 mi",
            "distanceValue": 14410,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 104 8th/Congress",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards William Cannon SB",
                "duration": "22 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "7",
                  "vehicle": "Bus",
                  "departureStop": "104 8th/Congress",
                  "arrivalStop": "Riverside/Burton",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:42 PM",
                  "numStops": 12,
                  "headsign": "William Cannon SB"
                }
              },
              {
                "instruction": "Walk to Riverside/Willow Creek",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Pleasant Valley WB",
                "duration": "42 mins",
                "distance": "5.5 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "Riverside/Willow Creek",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "4:51 PM",
                  "arrivalTime": "5:27 PM",
                  "numStops": 17,
                  "headsign": "Pleasant Valley WB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          },
          {
            "duration": "1 hour 8 mins",
            "durationValue": 4063,
            "distance": "6.8 mi",
            "distanceValue": 10865,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "27 mins",
                "distance": "5.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "7343 Riverside/Coriander",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:53 PM",
                  "numStops": 21,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "31 mins",
                "distance": "1.4 mi",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 1.25,
              "text": "$1.25"
            }
          },
          {
            "duration": "45 mins",
            "durationValue": 2692,
            "distance": "7.4 mi",
            "distanceValue": 11974,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 115 7th/Colorado",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady EB",
                "duration": "19 mins",
                "distance": "3.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "4",
                  "vehicle": "Bus",
                  "departureStop": "115 7th/Colorado",
                  "arrivalStop": "5119 Eastside Bus Plaza Bay J",
                  "departureTime": "5:13 PM",
                  "arrivalTime": "5:28 PM",
                  "numStops": 14,
                  "headsign": "Shady EB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "2 mins",
                "distance": "0.1 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 0 mins",
            "durationValue": 3602,
            "distance": "7.8 mi",
            "distanceValue": 12591,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Cesar Chavez/Brazos",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Eastside Bus Plaza SB",
                "duration": "24 mins",
                "distance": "3.3 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "2",
                  "vehicle": "Bus",
                  "departureStop": "Cesar Chavez/Brazos",
                  "arrivalStop": "5207 Eastside Bus Plaza Bay G",
                  "departureTime": "5:00 PM",
                  "arrivalTime": "5:17 PM",
                  "numStops": 10,
                  "headsign": "Eastside Bus Plaza SB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "3 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 3 mins",
            "durationValue": 3754,
            "distance": "7.7 mi",
            "distanceValue": 12385,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "19 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "2507 Riverside/Pleasant Valley",
                  "departureTime": "5:38 PM",
                  "arrivalTime": "5:55 PM",
                  "numStops": 13,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to 2007 Pleasant Valley/Riverside",
                "duration": "1 min",
                "distance": "210 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady LVA Clinicane EB",
                "duration": "17 mins",
                "distance": "4.4 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "2007 Pleasant Valley/Riverside",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "6:17 PM",
                  "arrivalTime": "6:34 PM",
                  "numStops": 13,
                  "headsign": "Shady LVA Clinicane EB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          }
        ],
        "bestRoute": {
          "duration": "57 mins",
          "durationValue": 3415,
          "distance": "7.7 mi",
          "distanceValue": 12385,
          "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
          "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
          "overview": "",
          "steps": [
            {
              "instruction": "Walk to Guadalupe/4th",
              "duration": "7 mins",
              "distance": "0.3 mi",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Bus towards ABIA Airport SB",
              "duration": "19 mins",
              "distance": "3.0 mi",
              "travelMode": "TRANSIT",
              "transit": {
                "line": "20",
                "vehicle": "Bus",
                "departureStop": "Guadalupe/4th",
                "arrivalStop": "2507 Riverside/Pleasant Valley",
                "departureTime": "4:37 PM",
                "arrivalTime": "4:52 PM",
                "numStops": 13,
                "headsign": "ABIA Airport SB"
              }
            },
            {
              "instruction": "Walk to 2007 Pleasant Valley/Riverside",
              "duration": "1 min",
              "distance": "210 ft",
              "travelMode": "WALKING"
            },
            {
              "instruction": "Bus towards Shady LVA Clinicane EB",
              "duration": "21 mins",
              "distance": "4.4 mi",
              "travelMode": "TRANSIT",
              "transit": {
                "line": "228",
                "vehicle": "Bus",
                "departureStop": "2007 Pleasant Valley/Riverside",
                "arrivalStop": "Metropolis/Veterans Clinic",
                "departureTime": "5:08 PM",
                "arrivalTime": "5:27 PM",
                "numStops": 13,
                "headsign": "Shady LVA Clinicane EB"
              }
            },
            {
              "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
              "duration": "1 min",
              "distance": "95 ft",
              "travelMode": "WALKING"
            }
          ],
          "fare": {
            "currency": "USD",
            "value": 2.5,
            "text": "$2.50"
          }
        },
        "alternatives": [
          {
            "duration": "1 hour 11 mins",
            "durationValue": 4244,
            "distance": "9.0 mi",
            "distanceValue": 14410,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 104 8th/Congress",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards William Cannon SB",
                "duration": "22 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "7",
                  "vehicle": "Bus",
                  "departureStop": "104 8th/Congress",
                  "arrivalStop": "Riverside/Burton",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:42 PM",
                  "numStops": 12,
                  "headsign": "William Cannon SB"
                }
              },
              {
                "instruction": "Walk to Riverside/Willow Creek",
                "duration": "5 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Pleasant Valley WB",
                "duration": "42 mins",
                "distance": "5.5 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "Riverside/Willow Creek",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "4:51 PM",
                  "arrivalTime": "5:27 PM",
                  "numStops": 17,
                  "headsign": "Pleasant Valley WB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          },
          {
            "duration": "1 hour 8 mins",
            "durationValue": 4063,
            "distance": "6.8 mi",
            "distanceValue": 10865,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "27 mins",
                "distance": "5.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "7343 Riverside/Coriander",
                  "departureTime": "4:22 PM",
                  "arrivalTime": "4:53 PM",
                  "numStops": 21,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "31 mins",
                "distance": "1.4 mi",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 1.25,
              "text": "$1.25"
            }
          },
          {
            "duration": "45 mins",
            "durationValue": 2692,
            "distance": "7.4 mi",
            "distanceValue": 11974,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to 115 7th/Colorado",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady EB",
                "duration": "19 mins",
                "distance": "3.1 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "4",
                  "vehicle": "Bus",
                  "departureStop": "115 7th/Colorado",
                  "arrivalStop": "5119 Eastside Bus Plaza Bay J",
                  "departureTime": "5:13 PM",
                  "arrivalTime": "5:28 PM",
                  "numStops": 14,
                  "headsign": "Shady EB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "2 mins",
                "distance": "0.1 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 0 mins",
            "durationValue": 3602,
            "distance": "7.8 mi",
            "distanceValue": 12591,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Cesar Chavez/Brazos",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Eastside Bus Plaza SB",
                "duration": "24 mins",
                "distance": "3.3 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "2",
                  "vehicle": "Bus",
                  "departureStop": "Cesar Chavez/Brazos",
                  "arrivalStop": "5207 Eastside Bus Plaza Bay G",
                  "departureTime": "5:00 PM",
                  "arrivalTime": "5:17 PM",
                  "numStops": 10,
                  "headsign": "Eastside Bus Plaza SB"
                }
              },
              {
                "instruction": "Walk to EastSide Bus Plaza BAY D",
                "duration": "3 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards to Luling",
                "duration": "10 mins",
                "distance": "3.9 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "1516",
                  "vehicle": "Bus",
                  "departureStop": "EastSide Bus Plaza BAY D",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "5:40 PM",
                  "arrivalTime": "5:50 PM",
                  "numStops": 1,
                  "headsign": "to Luling"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "4 mins",
                "distance": "0.2 mi",
                "travelMode": "WALKING"
              }
            ]
          },
          {
            "duration": "1 hour 3 mins",
            "durationValue": 3754,
            "distance": "7.7 mi",
            "distanceValue": 12385,
            "startAddress": "101 1/2 E 5th St., Austin, TX 78701, USA",
            "endAddress": "Metropolis/Veterans Clinic, Austin, TX 78744, USA",
            "overview": "",
            "steps": [
              {
                "instruction": "Walk to Guadalupe/4th",
                "duration": "7 mins",
                "distance": "0.3 mi",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards ABIA Airport SB",
                "duration": "19 mins",
                "distance": "3.0 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "20",
                  "vehicle": "Bus",
                  "departureStop": "Guadalupe/4th",
                  "arrivalStop": "2507 Riverside/Pleasant Valley",
                  "departureTime": "5:38 PM",
                  "arrivalTime": "5:55 PM",
                  "numStops": 13,
                  "headsign": "ABIA Airport SB"
                }
              },
              {
                "instruction": "Walk to 2007 Pleasant Valley/Riverside",
                "duration": "1 min",
                "distance": "210 ft",
                "travelMode": "WALKING"
              },
              {
                "instruction": "Bus towards Shady LVA Clinicane EB",
                "duration": "17 mins",
                "distance": "4.4 mi",
                "travelMode": "TRANSIT",
                "transit": {
                  "line": "228",
                  "vehicle": "Bus",
                  "departureStop": "2007 Pleasant Valley/Riverside",
                  "arrivalStop": "Metropolis/Veterans Clinic",
                  "departureTime": "6:17 PM",
                  "arrivalTime": "6:34 PM",
                  "numStops": 13,
                  "headsign": "Shady LVA Clinicane EB"
                }
              },
              {
                "instruction": "Walk to Metropolis/Veterans Clinic, Austin, TX 78744, USA",
                "duration": "1 min",
                "distance": "95 ft",
                "travelMode": "WALKING"
              }
            ],
            "fare": {
              "currency": "USD",
              "value": 2.5,
              "text": "$2.50"
            }
          }
        ]
      }
    },
    "summary": "3 transportation options available",
    "timestamp": "2025-07-09T21:13:20.870Z"
  },
  "recommendations": {
    "transportation": [
      "Consider public transit or driving",
      "Public transit recommended: 57 minutes travel time",
      "Alternative: driving (15 minutes)",
      "For convenience, consider rideshare services (Uber/Lyft)",
      "Public Transit: 57 mins via public transportation",
      "Driving: 15 mins (6.8 mi)",
      "Use covered transit stops",
      "Consider rideshare or taxi options",
      "Rain expected later - plan accordingly"
    ],
    "timing": [
      "Consider rescheduling if appointment is not urgent"
    ],
    "preparation": [
      "Transit fare: $2.50",
      "Check facility operating status before traveling",
      "Heavy precipitation: 1.54\" per hour",
      "Bring your VA ID card and any required documentation",
      "Call ahead to confirm appointment: 800-423-2111"
    ],
    "alternatives": [
      "Rideshare: 15-25 minutes ($12-25)"
    ],
    "weatherAlerts": []
  },
  "aiGuidance": {
    "primaryRecommendation": "\"primaryRecommendation\": \"Austin VA Clinic (undefined)\",",
    "reasoning": "Based on proximity, services, and current conditions",
    "travelAdvice": "\"travelAdvice\": \"Given the distance between facilities, driving (15 minutes) or using public transportation (57 minutes) are recommended over walking due to time constraints and potential weather conditions. If possible, consider carpooling or ride-sharing with fellow veterans or staff to reduce travel stress.\",",
    "weatherConsiderations": "Consider severe weather conditions",
    "additionalTips": "Contact the facility ahead of time to confirm services and hours",
    "urgencyLevel": "normal"
  },
  "searchParameters": {
    "radius": 50,
    "facilityType": "health"
  },
  "timestamp": "2025-07-09T21:18:19.552Z"
}
```
