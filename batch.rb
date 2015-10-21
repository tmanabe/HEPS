#!/usr/local/bin/ruby
# coding: utf-8

unless ARGV.length == 3 then

    puts "Usage: ruby #{__FILE__} phantomjs_path html_dir target_dir"
    exit(1)

end

# require "parallel"

phantomjs_path = ARGV[0]
html_dir       = ARGV[1].chomp("/")
target_dir     = ARGV[2].chomp("/")
js_path        = "#{File.dirname($0)}/batch.js"
heps_url       = "file://" + File.expand_path("#{File.dirname($0)}/HEPS.user.js")

Dir.mkdir(target_dir) unless File.exists?(target_dir)

Dir.glob("#{html_dir}/*.html").sort.each{ |html_path|
# Parallel.each(Dir.glob("#{html_dir}/*.html").sort,
#     {:in_threads => Parallel.processor_count}){ |html_path|

    html_url = "file://" + File.expand_path(html_path)
    json_path = "#{target_dir}/#{File.basename(html_path).chomp(".html")}.json"

    if File.exists?(json_path) then

        STDERR.puts("Warning: File exists. Skipping. (URL: #{html_url})")
        next

    end

    command = [phantomjs_path, js_path, heps_url, html_url].map{ |s|

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
