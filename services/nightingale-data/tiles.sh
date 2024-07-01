
for png_file in out/*.png; do
 if [ -f "$png_file" ]; then
        filename=$(basename -- "$png_file")
        extension="${filename##*.}"
        filename="${filename%.*}"
        input_dir="./out/vips_$filename"
        output_dir="./out/$filename"
        dist_dir="../../static/nightingale/map-tiles/$filename"
        vips dzsave "./out/$filename.png" "$input_dir" --tile-size 512 --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]
                
        # # For each png file in the out folder, convert it to webp



        # cwebp -q 90 -metadata none -noalpha "!input!" -o "!output!"

        # Convert JPG files to WEBP recursively
        find "$input_dir" -type f -name "*.jpg" | while read -r jpg_file; do
            if [ -f "$jpg_file" ]; then
                filename=$(basename -- "$jpg_file")
                directory=$(dirname -- "$jpg_file")
                relative_dir="${directory#$input_dir/}"  # Get relative directory path
                output_subdir="$dist_dir/$relative_dir"
                mkdir -p "$output_subdir"
                filename="${filename%.*}"
                cwebp "$jpg_file" -o "$output_subdir/$filename.webp"
                echo "Converted $jpg_file to $output_subdir/$filename.webp"
            fi
        done

    fi
done

