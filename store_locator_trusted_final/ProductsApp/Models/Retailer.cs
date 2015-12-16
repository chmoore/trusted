using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProductsApp.Models
{
    public class Retailer
    { 
        public int Id { get; set; }
        public int MarkerSerial { get; set; } //For presentation only
        public string Name { get; set; }
        public string BrandName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string Zip { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Distance { get; set; }
        public string Phone { get; set; }
        public List<string> StoreHours { get; set; }
        public string Logo { get; set; }

    }
}