# HEPS: a HEading-based Page Segmentation algorithm

All the details are in [our paper](http://www.vldb.org/pvldb/vol8/p1606-manabe.pdf).

## batch.rb

* supports batch processing by HEPS.
* Usage:
```
$ ruby batch.rb <path_to_PhantomJS_binary> ./html-dir ./target-dir
```
* It is developed by using:
	* CentOS release 6.5
	* Ruby 2.1.2p95
	* PhantomJS 2.0.1-development

## Notes

- This implementation ignores the childNodes of IFRAME and NOSCRIPT elements as well as SCRIPT and STYLE elements.
- Current parameter values are roughly optimized for entire [our data set](https://github.com/tmanabe/HEPS-data-set) (not only the training data set explained in our paper).

## Link

* [Our data set](https://github.com/tmanabe/HEPS-data-set)
