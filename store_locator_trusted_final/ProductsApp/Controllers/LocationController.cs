using ProductsApp.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace ProductsApp.Controllers
{
    public class LocationController : ApiController
    {
        Retailer[] retailerList = new Retailer[]
        {
            new Retailer {
                Id = 1,
                MarkerSerial =1,
                Name = "Fort Lauderdale Gallery",
                BrandName = "ng",
                Address ="607 E Las Olas Blvd",
                City ="Fort Lauderdale",
                State ="FL",
                Country ="USA",
                Zip ="33301",
                Latitude =26.119736,
                Longitude = -80.136897,
                Distance =1,
                Phone ="(555) 555 5555",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ", 
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/national_geographic-logo.jpg"  },

            new Retailer {
                Id = 2,
                MarkerSerial =2,
                Name = "Richard Mille Boutique",
                BrandName = "ng",
                Address ="9700 Collins Ave",
                City ="Bal Harbour",
                State ="FL",
                Country ="USA",
                Zip ="33154",
                Latitude =25.888888, 
                Longitude = -80.124773,
                Distance =1,
                Phone ="(555) 555 5555",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ",
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/Richard-Mille-logo.png"  },
            new Retailer {
                Id = 3,
                MarkerSerial =3,
                Name = "Diamond Design",
                BrandName = "mille",
                Address ="10 Rowan St",
                City ="St John's",
                State ="NL",
                Country ="Canada",
                Zip ="A1B 2X1",
                Latitude =47.574617, 
                Longitude = -52.722177,
                Distance =1,
                Phone ="(555) 555 5555",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ",
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/tagheuer.png"  },
            new Retailer {
                Id = 4,
                MarkerSerial =4,
                Name = "Pipers",
                BrandName = "mille",
                Address ="33 Elizabeth Ave",
                City ="Fort Lauderdale",
                State ="FL",
                Country ="Canada",
                Zip ="A1A 1W6",
                Latitude =26.119736,
                Longitude = -80.136897,
                Distance =1,
                Phone ="(555) 666 6666",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ",
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/pipers-logo.jpg"  },
            new Retailer {
                Id =5,
                MarkerSerial =5,
                Name = "Fort Lauderdale Gallery",
                BrandName = "mille",
                Address ="607 E Las Olas Blvd",
                City ="Fort Lauderdale",
                State ="FL",
                Country ="USA",
                Zip ="33301",
                Latitude =26.119736,
                Longitude = -80.136897,
                Distance =1,
                Phone ="(555) 555 5555",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ",
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/national_geographic-logo.jpg"  },
            new Retailer {
                Id = 6,
                MarkerSerial =6,
                Name = "Executive Coffee Svc Ltd",
                BrandName = "heuer",
                Address ="54 Pippy Pl",
                City ="St. John's",
                State ="NL",
                Country ="Canada",
                Zip ="A1B 4H7",
                Latitude =47.562845,
                Longitude = -52.771599,
                Distance =1,
                Phone ="(555) 777 7777",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ",
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/national_geographic-logo.jpg"  },
            new Retailer {
                Id = 7,
                MarkerSerial =7,
                Name = "Flanigan’s",
                BrandName = "heuer",
                Address ="Surfside Plaza, 9516 Harding Ave, Surfside",
                City ="Maimi",
                State ="FL",
                Country ="USA",
                Zip ="33154",
                Latitude =25.885848,
                Longitude = -80.123775,
                Distance =1,
                Phone ="(555) 555 6666",
                StoreHours = new List<string>() {
                    "Mon-Sat: 10:00 AM - 10:00 PM ",
                    "Sun: 11:00 AM - 7:00 PM "
                },
                Logo ="assets/logo/national_geographic-logo.jpg"  }
            
        };
        public IEnumerable<Retailer> GetAllretailerList()
        {
            return retailerList;
        }
        public IEnumerable<Retailer> GetRetailer(string textSearch,string address, string city, string state,string zipcode)
        {
            List<Retailer> retailers = new List<Retailer>();
            retailers = retailerList.ToList();
            bool isSearch = false;
           
            if (!string.IsNullOrWhiteSpace(city))
            {
                isSearch = true;
                   retailers = retailers.Where((p) => p.City.ToLowerInvariant().Contains(city)).ToList();
            }
            if (!string.IsNullOrWhiteSpace(state))
            {
                isSearch = true;
                retailers = retailers.Where((p) => p.State.ToLowerInvariant().Contains(state)).ToList();
            }
            if (!string.IsNullOrWhiteSpace(zipcode))
            {
                isSearch = true;
                retailers = retailerList.Where((p) => p.Zip.ToLowerInvariant().Contains(zipcode)).ToList();
            }
            if (!isSearch && !string.IsNullOrWhiteSpace(textSearch))
            {
                retailers = retailers.Where((p) => p.Name.ToLowerInvariant().Contains(textSearch)).ToList();
            }
            int i = 1;
            foreach(var item in retailers)
            {
                item.MarkerSerial = i;
                i++;
            }
                return retailers;
        }
        public IEnumerable<Retailer> GetAllRetailer(string brand, string country)
        {
            List<Retailer> retailers = new List<Retailer>();
            retailers = retailerList.ToList(); 

            if (!string.IsNullOrWhiteSpace(brand))
            { 
                retailers = retailers.Where((p) => p.BrandName.ToLowerInvariant().Contains(brand)).ToList();
            }
            if (!string.IsNullOrWhiteSpace(country))
            { 
                retailers = retailers.Where((p) => p.Country.ToLowerInvariant().Contains(country)).ToList();
            } 

            return retailers;
        }
    }
}
