interface Props extends Hono.ImgHTMLAttributes {
	lazySrc: () => Promise<string>;
}

export default async function LazyImage({ lazySrc, alt, ...props }: Props) {
	return <img {...props} src={await lazySrc()} alt={alt} />;
}
