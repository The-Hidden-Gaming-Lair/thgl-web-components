import os
vipsbin = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bin', 'vips')

os.environ['PATH'] = vipsbin + ';' + os.environ['PATH']

import sys
import glob
import pyvips

input_directory = sys.argv[1]
output_file = sys.argv[2]
tiles_across = int(sys.argv[3])

images = [pyvips.Image.new_from_file(filename, access="sequential")
          for filename in glob.glob(f"{input_directory}/*")]
images = sorted(images, key=lambda image: image.filename)

joined = pyvips.Image.arrayjoin(images, across=tiles_across)

joined.write_to_file(output_file)