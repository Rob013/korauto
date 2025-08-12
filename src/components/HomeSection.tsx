import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search, Filter, Car, Shield, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";

const HomeSection = () => {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pt-8 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section with Search - encar.com style */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Car from 
            <span className="text-blue-600 dark:text-blue-400"> South Korea</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Premium quality vehicles with professional inspection services and the best prices in Kosovo
          </p>

          {/* Prominent Search Bar - like encar.com */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>All Brands</option>
                  <option>Toyota</option>
                  <option>Honda</option>
                  <option>Hyundai</option>
                  <option>Kia</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>All Models</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Any Year</option>
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                  <option>2021</option>
                  <option>2020</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Any Price</option>
                  <option>Under €20,000</option>
                  <option>€20,000 - €30,000</option>
                  <option>€30,000 - €50,000</option>
                  <option>Over €50,000</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                onClick={() => window.location.href = '/catalog'}
              >
                <Search className="h-5 w-5 mr-2" />
                Search Cars
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3"
                onClick={() => window.location.href = '/catalog'}
              >
                <Filter className="h-5 w-5 mr-2" />
                Advanced Search
              </Button>
            </div>
          </div>

          {/* Quick Category Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Link to="/catalog?type=sedan" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sedans</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comfort & Style</p>
              </div>
            </Link>
            <Link to="/catalog?type=suv" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">SUVs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Space & Power</p>
              </div>
            </Link>
            <Link to="/catalog?type=hatchback" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Hatchbacks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">City Driving</p>
              </div>
            </Link>
            <Link to="/catalog?type=luxury" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Luxury</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Premium Experience</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Services Section - encar.com style features */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Why Choose KORAUTO?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Professional Inspection</h3>
              <p className="text-gray-600 dark:text-gray-400">Every vehicle undergoes thorough professional inspection before delivery</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Fast Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">Quick and reliable shipping from South Korea to Kosovo</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Best Prices</h3>
              <p className="text-gray-600 dark:text-gray-400">Competitive pricing with transparent costs and no hidden fees</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">500+</div>
                <div className="text-blue-100">Cars Delivered</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">100%</div>
                <div className="text-blue-100">Customer Satisfaction</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-3xl md:text-4xl font-bold mb-1">24/7</div>
                <div className="text-blue-100">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HomeSection;