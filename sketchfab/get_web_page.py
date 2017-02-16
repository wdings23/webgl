#!/usr/bin/env python

import requests
import json
import os
import jsbeautifier
import webbrowser
import sys
import cgi

##
def reverse_find(text, search, index):
    while index >= 0:
        find_content = text[index:]
        find_index = find_content.find(search)
        
        if find_index == 0:
            return index

        index -= 1

    return index

##
def get_function_content(text, start):
    
    start = text.find('{', start)

    count = 1
    index = 1
    while True:
        c = text[start+index]
        if c == '}':
            count -= 1
        elif c == '{':
            count += 1        

        index += 1

        if count == 0:
            break

    content = text[start:start+index]

    return [content, start, start+index]

##
def get_webpage(url):
  
    template_file = open('template.js', 'rb')
    template_content = template_file.read()
    template_file.close()

    model_name_url = os.path.basename(url)

    print('Downloaded html file')

    html_content = requests.get(url).content
    
    html_name = ''    
    html_url = ''    

    start_tag = '<script src="'
    end_tag = '</script>'

    start = html_content.find(start_tag)
    while start >= 0:
        end = html_content.find(end_tag, start + len(start_tag))
        
        if end >= 0:
            script_content = html_content[start:end + len(end_tag)]
            index = script_content.find('viewer-')
            if index >= 0:
                
                # get the script url
                url_index = reverse_find(script_content, 'https://', index)
                end_index = script_content.find('.js', index) + len('.js')
                html_name = script_content[index:end_index - len('.js')] + '.html'
                js_url = script_content[url_index:end_index]
                js_basename = os.path.basename(js_url)               
                js_noextension = os.path.splitext(js_basename)[0]

                model_name_start = 0
                last_model_name_start = 0
                parsed_template_content = ''
                while True:
                    model_name_start = template_content.find("'new_model_'", last_model_name_start)
                    if model_name_start >= 0:
                        model_name_end = model_name_start + len('new_model_')
                        parsed_template_content += template_content[last_model_name_start:model_name_start]
                        parsed_template_content += "'" + model_name_url + '_'
                        
                        last_model_name_start = model_name_end + 1
                    else:
                        parsed_template_content += template_content[last_model_name_start:]
                        break
                
                # new html content with new-viwer
                new_html_content = html_content[:start + url_index]
                new_html_content += 'new-' + js_basename
                new_end_index = html_content.find('.js', start + url_index) + len('.js');
                new_html_content += html_content[new_end_index:]                

                html_file = open(html_name, 'wb')
                html_file.write(new_html_content)
                html_file.close()

                # javascript content
                js_content = requests.get(js_url).content.decode('ascii', 'ignore')
                
                js_file = open(js_basename, 'wb')
                js_file.write(js_content)
                js_file.close()
                
                print('Downloaded and prettifying javascript: %s' % (js_basename))

                # prettify javascript
                pretty_js = jsbeautifier.beautify_file(js_basename).decode('ascii', 'ignore')
                pretty_file = open('pretty-' + js_basename, 'wb')
                pretty_file.write(pretty_js)
                pretty_file.close()                
                
                print('Finished prettifying')

                # function to insert saveModel function
                function_start = pretty_js.find('prototype.drawGeometry = function')        
                function_content = get_function_content(pretty_js, function_start)
    
                inserted_content = '{\nvar created = checkModelCreated(this);\n\n'
                inserted_content += function_content[0][1:len(function_content[0])-1]
                inserted_content += '\nif(!created)\n{\n\tsaveModel(this);\n}\n}'
                                
                # new javascript with the saveModel function inserted
                new_js_content = parsed_template_content + '\n\n'
                new_js_content += pretty_js[:function_content[1]]
                new_js_content += inserted_content
                new_js_content += pretty_js[function_content[2]:]

                new_js_file = open('new-' + js_basename, 'wb')
                new_js_file.write(new_js_content)
                new_js_file.close()

                print('Finished new javascript: %s' % ('new-' + js_basename))

                break             

            start = end + len(end_tag)

    return html_name

##
def main():
    #form = cgi.FieldStorage()
    #url = form.getvalue('url')

    url = sys.argv[1]
    html_name = get_webpage(url)
    
    if len(html_name):
        webbrowser.open('http://localhost:8888/' + html_name, new = 2)    
      
##

if __name__ == '__main__':
    main()