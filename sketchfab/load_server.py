#!/usr/bin/env python

import subprocess
import os
import sys
import CGIHTTPServer
import BaseHTTPServer

import cgitb; cgitb.enable()

##
##  Handler for requests
##
class Handler(CGIHTTPServer.CGIHTTPRequestHandler):
    cgi_directories = '/cgi'

    ##
    def do_GET(self):
        print('GET')

        self.curr_directory = os.path.dirname(os.path.realpath(__file__))

        response = ''
        
        dir = os.path.dirname(self.path)

        try:
            if dir == self.cgi_directories:
                CGIHTTPServer.CGIHTTPRequestHandler.do_GET(self)

            else:
                new_path = self.curr_directory
                dirs = ['html', 'css', 'js', '']
                    
                query_start = self.path.find('?')
                formatted = self.path

                if query_start != -1:
                    formatted = self.path[:query_start]

                for dir in dirs:
                    full_path = new_path + '/' + dir  + formatted
                        
                    try:
                        page_type = 'text/html'
                        if full_path.find('.css') != -1:
                            page_type = 'text/css'

                        file = open(full_path, 'rb')
                        response += file.read()
                        self.send_page(response, page_type)                            

                        break
                    except Exception as e:
                        print('')

        except Exception as e:
            print(('error : %s' % str(e)))

    ##
    def do_POST(self):
        self.curr_directory = os.path.dirname(os.path.realpath(__file__))

        response = ''
        
        dir = os.path.dirname(self.path)
        
        try:
            if dir == self.cgi_directories:
                CGIHTTPServer.CGIHTTPRequestHandler.do_POST(self)

        except Exception as e:
            print(('error : %s' % str(e)))

    ##
    def send_page(self, content, content_type):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Content-length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

##
## Server
##
class FileServer(BaseHTTPServer.HTTPServer):
    
    ##
    def __init__(self, server_address, request_handler_class):
        BaseHTTPServer.HTTPServer.__init__(self, server_address, request_handler_class)
        self.running = False

    ##
    def serve_stuff(self):
        self.running = True
        while True:
            self.handle_request()

            if self.running == False:
                break

##
def main():
    httpd = FileServer(('', 8675), Handler)
    httpd.serve_stuff()

##
if __name__ == '__main__':
    main()
