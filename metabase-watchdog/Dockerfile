FROM openjdk:8-jre

WORKDIR /opt
ENV METABASE_VERSION="0.31.2"
RUN wget --no-verbose "http://downloads.metabase.com/v${METABASE_VERSION}/metabase.jar" -O ./metabase.jar

ADD startup.sh /
ADD env_secrets_expand.sh /

CMD ["/startup.sh"]

