import re

# Read the file
with open('src/components/WhiteboardCanvas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Remove 'key: stroke.id,' from commonProps (line ~773)
content = re.sub(
    r'(const commonProps = \{)\s*key: stroke\.id,\s*',
    r'\1\n            ',
    content
)

# Step 2: Add new shape cases after the existing 'rectangle' case
rectangle_case = r"""            case 'rectangle':
                return (
                    <Rect
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={Math.min(start.x, end.x)}
                        y={Math.min(start.y, end.y)}
                        width={Math.abs(width)}
                        height={Math.abs(height)}
                    />
                );"""

filled_rectangle_case = """            case 'filled-rectangle':
                return (
                    <Rect
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={Math.min(start.x, end.x)}
                        y={Math.min(start.y, end.y)}
                        width={Math.abs(width)}
                        height={Math.abs(height)}
                        fill={stroke.color}
                    />
                );"""

content = content.replace(rectangle_case, rectangle_case + '\n' + filled_rectangle_case)

# Step 3: Add filled-circle after circle
circle_case = r"""            case 'circle':
                return (
                    <Ellipse
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={start.x + width / 2}
                        y={start.y + height / 2}
                        radiusX={Math.abs(width) / 2}
                        radiusY={Math.abs(height) / 2}
                    />
                );"""

filled_circle_case = """            case 'filled-circle':
                return (
                    <Ellipse
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={start.x + width / 2}
                        y={start.y + height / 2}
                        radiusX={Math.abs(width) / 2}
                        radiusY={Math.abs(height) / 2}
                        fill={stroke.color}
                    />
                );
            case 'triangle':
                return (
                    <Line
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        points={[
                            start.x + width / 2, start.y,
                            start.x + width, end.y,
                            start.x, end.y,
                        ]}
                        closed={true}
                    />
                );
            case 'filled-triangle':
                return (
                    <Line
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        points={[
                            start.x + width / 2, start.y,
                            start.x + width, end.y,
                            start.x, end.y,
                        ]}
                        closed={true}
                        fill={stroke.color}
                    />
                );"""

content = content.replace(circle_case, circle_case + '\n' + filled_circle_case)

# Step 4: Add curved-line after line
line_case = r"""            case 'line':
                return (
                    <Line
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        points={[start.x, start.y, end.x, end.y]}
                        lineCap="round"
                    />
                );"""

curved_line_case = """            case 'curved-line':
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const controlX = midX - (dy / dist) * (dist * 0.2);
                const controlY = midY + (dx / dist) * (dist * 0.2);
                
                return (
                    <Line
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        points={[start.x, start.y, controlX, controlY, end.x, end.y]}
                        tension={0.5}
                        bezier={true}
                        lineCap="round"
                    />
                );"""

content = content.replace(line_case, line_case + '\n' + curved_line_case)

# Write the file
with open('src/components/WhiteboardCanvas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
