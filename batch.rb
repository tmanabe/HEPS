#!/usr/local/bin/ruby
# coding: utf-8

unless ARGV.length == 3 then

    puts "Usage: ruby #{__FILE__} phantomjs_path <html_dir|URL_list> target_dir"
    exit(1)

end

# require "parallel"

phantomjs_path = ARGV[0]
input_path     = ARGV[1].chomp("/")
target_dir     = ARGV[2].chomp("/")
js_path        = "#{File.dirname($0)}/batch.js"
heps_path      = File.expand_path("#{File.dirname($0)}/HEPS.user.js")

Dir.mkdir(target_dir) unless File.exists?(target_dir)

url2basename = if Dir.exists?(input_path) then

    Dir.glob("#{input_path}/*.html").sort.inject({}){ |result, html_path|

        result["file://" + File.expand_path(html_path)] =
            File.basename(html_path).chomp(".html")
        result

    }

else

    open(input_path, "r") { |fd|

        fd.read

    }.split(/\r?\n/).each_with_index.inject({}){ |result, (url, index)|

        result[url] = index.to_s
        result

    }

end

url2basename.each{ |url, basename|
# Parallel.each(url2basename,
#     {:in_threads => Parallel.processor_count}){ |url, basename|

    json_path = "#{target_dir}/#{basename}.json"

    if File.exists?(json_path) then

        STDERR.puts("Warning: File exists. Skipping. (URL: #{url})")
        next

    end

    command = [phantomjs_path, js_path, heps_path, url].map{ |s|

        '"' + s + '"'

    }.join(" ")
    
    buffer = `#{command}`

    if $?.success? then

        open(json_path, "w") { |fd|

            fd.print(buffer)

        }

    else

        STDERR.puts("Error: PhantomJS execution failed (URL: #{url})")

    end

}
